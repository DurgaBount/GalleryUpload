/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import {realmContext, TestRealm} from './Realm';
import {ProgressView} from '@react-native-community/progress-view';
import NetInfo from '@react-native-community/netinfo';
import moment from 'moment';
import {styles} from './styles';

interface MainScreenProps {}
interface ImageSet {
  uri: any;
  isOnline: boolean;
  progress: number;
  fileName: string;
}
const {useQuery, useRealm} = realmContext;

const MainScreen: React.FC<MainScreenProps> = () => {
  const [imagesList, setImagesList] = useState<ImageSet[]>([]);
  const [filteredImageList, setFilteredImageList] = useState<ImageSet[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedForCancel, setSelectedForCancel] = useState<any>();
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const realm = useRealm();

  let data = useQuery<TestRealm>(TestRealm);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const openCamera = () => {
    launchCamera({mediaType: 'photo'}, (res: ImagePickerResponse) => {
      if (res.assets) {
        console.log('CaptureRes:', JSON.stringify(res.assets[0].uri));
        const image = res.assets[0];
        uploadImage(image);
        toggleModal();
      } else if (res.didCancel) {
        console.log('User canclled the image:');
      } else {
        console.log('CapturingPictureFailureRes:', JSON.stringify(res));
      }
    });
  };

  const openGallery = () => {
    launchImageLibrary({mediaType: 'photo'}, (res: ImagePickerResponse) => {
      console.log('PickingPictureFailureRes:', JSON.stringify(res));

      if (res.assets) {
        const image = res.assets[0];
        uploadImage(image);
        toggleModal();
      } else if (res.didCancel) {
        console.log('User canclled the image:');
      } else {
        console.log('PickingPictureFailureRes:', JSON.stringify(res));
      }
    });
  };

  const DeleteObjectFormRealm = (url: string) => {
    const deleteIndex = data.findIndex(item => {
      return item.url === url;
    });
    if (deleteIndex >= 0) {
      realm.write(() => {
        realm.delete(data[deleteIndex]);
      });
    }
  };

  const handleImageWithRealm = (image: Asset) => {
    const timestamp = moment().format('YYYYMMDDHHmmssSSS');
    const filename = `IMG${timestamp}`;

    console.log('Selected image URI: ', image.uri);
    realm.write(() => {
      realm.create('TestRealm', {
        _id: new Realm.BSON.ObjectID(),
        name: filename,
        url: image.uri,
        completed: true,
        createdAt: new Date(),
      });

      const imageListCopy = [...imagesList];

      imageListCopy.push({
        uri: image.uri,
        isOnline: false,
        progress: 0,
        fileName: filename,
      });

      console.log('ImageList', imageListCopy);
      setImagesList(imageListCopy);
    });
  };

  const handleOfflineImagesWithiFirebaseStorage = (uri: any) => {
    let imageListCopy = [...imagesList];
    const image: any = imageListCopy.find(item => {
      return item.uri === uri;
    });

    let pathToFile;
    if (Platform.OS === 'android') {
      pathToFile = image.uri;
    } else if (Platform.OS === 'ios') {
      pathToFile = image.uri.replace('file://', '');
    }

    const storageRef = storage().ref('images').child(image.fileName);
    const task = storageRef.putFile(pathToFile);

    // task.on('state_changed', taskSnapshot => {
    //   const percentage =
    //     taskSnapshot.bytesTransferred / taskSnapshot.totalBytes;

    //   console.log('percentage', percentage);

    //   const updatedImageList = imageListCopy.map(item => {
    //     if (image.uri === item.uri) {
    //       return {...item, progress: percentage, isOnline: true};
    //     }
    //     return item;
    //   });
    //   setImagesList(updatedImageList);
    // });

    task.then(() => {
      const updatedImageList = imageListCopy.map(item => {
        if (image.uri === item.uri) {
          return {...item, progress: 100, isOnline: true};
        }
        return item;
      });
      setImagesList(updatedImageList);

      DeleteObjectFormRealm(image.uri);
      console.log('Offlie Image uploaded to the bucket!');
    });
  };

  const handleImageWithiFirebaseStorage = (uri: any) => {
    const timestamp = moment().format('YYYYMMDDHHmmssSSS');
    const filename = `IMG${timestamp}`;

    let pathToFile;
    if (Platform.OS === 'android') {
      pathToFile = uri;
    } else if (Platform.OS === 'ios') {
      pathToFile = uri.replace('file://', '');
    }

    const storageRef = storage().ref('images').child(filename);
    const task = storageRef.putFile(pathToFile);

    let imageListCopy = [...imagesList];

    let myIndex = -1;

    myIndex = imageListCopy.findIndex(item => {
      return item.uri === uri;
    });

    if (myIndex >= 0) {
      imageListCopy[myIndex].isOnline = false;
      imageListCopy[myIndex].progress = 0;
      imageListCopy[myIndex].fileName = filename;
    } else {
      imageListCopy.push({
        uri: uri,
        isOnline: false,
        progress: 0,
        fileName: filename,
      });
    }

    console.log('ImageList', imageListCopy);
    setImagesList(imageListCopy);
    const imageIndex = imageListCopy.length - 1;

    task.on('state_changed', taskSnapshot => {
      const percentage =
        taskSnapshot.bytesTransferred / taskSnapshot.totalBytes;
      const updatedImageList = imageListCopy.map((image, index) => {
        if (index === imageIndex) {
          return {...image, progress: percentage};
        }
        return image;
      });
      setImagesList(updatedImageList);
    });

    task.then(() => {
      if (data.length) {
        DeleteObjectFormRealm(uri);
      }

      const updatedImageList = imageListCopy.map(image => {
        if (image.uri === uri) {
          return {...image, isOnline: true};
        }
        return image;
      });

      setImagesList(updatedImageList);
      console.log('Image uploaded to the bucket!');
    });
  };

  const uploadImage = async (image: Asset) => {
    const netInfoState = await NetInfo.fetch();
    const isConnected = netInfoState.isConnected;
    if (isConnected) {
      handleImageWithiFirebaseStorage(image.uri);
    } else {
      handleImageWithRealm(image);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchImagesFromStorage();
    };

    fetchData();
  }, []);

  useEffect(() => {
    let alreadyConnected: boolean = false;

    const unsubscribe = NetInfo.addEventListener(async state => {
      if (state.isConnected && state.isInternetReachable && !alreadyConnected) {
        alreadyConnected = true;
        console.log('Iamgess', JSON.stringify(imagesList));
        console.log('data', JSON.stringify(data));

        if (data.length) {
          await handleOfflineImagesWithiFirebaseStorage(data[0].url);
        }
      } else if (!state.isConnected) {
        alreadyConnected = false;
      }
    });
    return () => {
      unsubscribe();
    };
  }, [imagesList]);

  const handleSearch = (query: string) => {
    const filteredImages = imagesList.filter(image =>
      image.fileName.includes(query),
    );
    setFilteredImageList(filteredImages);
  };

  const fetchImagesFromStorage = async () => {
    const netInfoState = await NetInfo.fetch();
    const isConnected = netInfoState.isConnected;

    console.log('imageRefs', 'called');

    if (isConnected) {
      const imageRefs = await storage().ref().child('images/').listAll();

      const urls = await Promise.all(
        imageRefs.items.map(async ref => {
          const mobj: ImageSet = {
            uri: await ref.getDownloadURL(),
            isOnline: true,
            progress: 1, // Add the progress property and set it to 0 initially
            fileName: await ref.fullPath.replace('images/', ''),
          };

          return mobj;
        }),
      );

      const localUrls = await Promise.all(
        data.map(async ref => {
          const mobj: ImageSet = {
            uri: ref.url,
            isOnline: false,
            progress: 0, // Add the progress property and set it to 0 initially
            fileName: ref.name,
          };
          return mobj;
        }),
      );

      const finalUrls = [...localUrls, ...urls];
      setImagesList(finalUrls);
      console.log('imageRefsIF', 'called');

      return finalUrls;
    } else {
      const localUrls = await Promise.all(
        data.map(async ref => {
          const mobj: ImageSet = {
            uri: ref.url,
            isOnline: false,
            progress: 0, // Add the progress property and set it to 0 initially
            fileName: ref.name,
          };
          return mobj;
        }),
      );

      setImagesList(localUrls);
      console.log('imageRefsElse', 'call');

      return localUrls;
    }
  };

  const deleteFile = async () => {
    const netInfoState = await NetInfo.fetch();
    const isConnected = netInfoState.isConnected;

    const item = selectedForCancel;

    const imageListCopy = [...imagesList];
    setDeleteModalVisible(false);

    if (item?.isOnline) {
      if (isConnected) {
        const imageRef = storage().ref(`images/${item.fileName}`);
        imageRef
          .delete()
          .then(() => {
            console.log('Image deleted successfully.');
          })
          .catch(error => {
            console.log('Error deleting image:', error);
          });
        const updatedImageList = imageListCopy.filter(i => {
          return i.uri !== item?.uri;
        });
        setImagesList(updatedImageList);
      } else {
        Alert.alert('No internet Connection to remove the online image');
      }
    } else {
      DeleteObjectFormRealm(item?.uri);
      const updatedImageList = imageListCopy.filter(i => {
        return i.uri !== item?.uri;
      });
      setImagesList(updatedImageList);
    }
  };

  const renderItem = ({item}: {item: ImageSet}) => {
    return (
      <View style={styles.imageContainer}>
        <View>
          <Image style={styles.image} source={{uri: item.uri}} />
          <View style={styles.onlineOfflineIconPosition}>
            <Image
              source={
                item.isOnline
                  ? require('../assets/online.png')
                  : require('../assets/offline.png')
              }
              style={styles.iconSizes}
              tintColor={'white'}
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setDeleteModalVisible(true);
              setSelectedForCancel(item);
            }}
            style={styles.cancelIconPosition}>
            <Image
              source={require('../assets/cancel.png')}
              style={styles.iconSizes}
              tintColor={'white'}
            />
          </TouchableOpacity>
        </View>
        {!item.isOnline && (
          <View style={styles.progressBarContainer}>
            <ProgressView
              progressTintColor="orange"
              trackTintColor="blue"
              progress={item.progress}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBarContainer}>
        <TouchableOpacity style={styles.inputContainer}>
          <TextInput
            value={searchText}
            placeholder="Search image"
            onChangeText={text => {
              if (!text) {
                setFilteredImageList([]);
              } else {
                handleSearch(text);
              }
              setSearchText(text);
            }}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.listContainer}>
        <FlatList
          numColumns={3}
          data={searchText ? filteredImageList : imagesList}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
      <TouchableOpacity
        onPress={() => {
          setModalVisible(true);
        }}
        style={styles.buttonContainer}>
        <Text style={styles.buttonText}>Upload</Text>
      </TouchableOpacity>
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                openCamera();
              }}>
              <Text style={styles.modalText}>Open Camera</Text>
            </TouchableOpacity>

            <View style={styles.modalSeparator} />

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                openGallery();
              }}>
              <Text style={styles.modalText}>Open Gallery</Text>
            </TouchableOpacity>

            <View style={styles.modalSeparator} />
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                toggleModal();
              }}>
              <Text style={styles.modalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={isDeleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setDeleteModalVisible(false);
          setSelectedForCancel('');
        }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.deleteTextHeading}>
              Are you sure you want to delete
            </Text>

            <View style={styles.deleteContainer}>
              <TouchableOpacity
                style={styles.deleteModalButtonContainers}
                onPress={deleteFile}>
                <Text style={styles.modalText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalButtonContainers}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setSelectedForCancel('');
                }}>
                <Text style={styles.modalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MainScreen;
