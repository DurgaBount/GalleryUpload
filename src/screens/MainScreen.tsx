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
import {styles} from './Styles';

interface MainScreenProps {}
interface ImageSet {
  uri: any;
  isOnline: boolean;
  fileName: string;
}
interface ImageProgress {
  uri: any;
  progress: number;
}
const {useQuery, useRealm} = realmContext;

const MainScreen: React.FC<MainScreenProps> = () => {
  const [imgProgressList, setImgProgressList] = useState<ImageProgress[]>([]);
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
      console.log('PickingPictureRes:', JSON.stringify(res));

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

  const DeleteObjectFormRealm = async (url: string) => {
    const deleteIndex = data.findIndex(item => {
      return item.url === url;
    });
    console.log(deleteIndex, 'deleteIndex');
    if (deleteIndex >= 0) {
      realm.write(() => {
        realm.delete(data[deleteIndex]);
      });
    }
  };

  const UpdateDeleteObjectinRealm = (
    imageId: Realm.BSON.ObjectId,
    isDeleted: boolean,
  ) => {
    console.log('id', imageId);

    realm.write(() => {
      const imageToUpdate = realm.objectForPrimaryKey<TestRealm>(
        'TestRealm',
        imageId,
      );

      if (imageToUpdate) {
        imageToUpdate.isDeleted = isDeleted; // Update the 'isDeleted' property directly
      }
    });
  };

  const handleImageWithRealm = (image: Asset, isOnline: boolean) => {
    const timestamp = moment().format('YYYYMMDDHHmmssSSS');
    const filename = `IMG${timestamp}`;

    let isThere = false;

    isThere = data.some(item => {
      return item.name === image.fileName;
    });

    if (!isThere) {
      console.log('Selected image URI: ', image.uri);
      realm.write(() => {
        realm.create('TestRealm', {
          _id: new Realm.BSON.ObjectID(),
          name: isOnline ? image.fileName : filename,
          url: image.uri,
          completed: true,
          createdAt: new Date(),
          isOnline: isOnline,
          isDeleted: false,
        });

        const imageListCopy = [...imagesList];

        imageListCopy.push({
          uri: image.uri,
          isOnline: isOnline,
          //progress: 0,
          fileName: filename,
        });

        console.log('ImageList', imageListCopy);
        setImagesList(imageListCopy);
      });
    } else {
      const imageListCopy = [...imagesList];

      imageListCopy.push({
        uri: image.uri,
        isOnline: isOnline,
        fileName: filename,
      });

      console.log('ImageList', imageListCopy);
      setImagesList(imageListCopy);
    }
  };

  const updateIsOnlineWithRealm = (
    imageId: Realm.BSON.ObjectId,
    isOnline: boolean,
  ) => {
    realm.write(() => {
      const imageToUpdate = realm.objectForPrimaryKey<TestRealm>(
        'TestRealm',
        imageId,
      );

      if (imageToUpdate) {
        imageToUpdate.isOnline = isOnline; // Update the 'isOnline' property directly
      }
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

    const imgProgressListCopy = [...imgProgressList];
    imgProgressListCopy.push({
      uri: uri,
      progress: 0,
    });

    console.log('ImageList', imageListCopy);
    setImgProgressList(imgProgressListCopy);

    task.on('state_changed', taskSnapshot => {
      const percentage =
        taskSnapshot.bytesTransferred / taskSnapshot.totalBytes;

      console.log('percentage', percentage);

      const updatedImageList = imgProgressListCopy.map(image => {
        if (image.uri === uri) {
          return {...image, progress: percentage};
        }
        return image;
      });
      setImgProgressList(updatedImageList);
    });

    task.then(() => {
      const myObject = data.find(item => {
        return item.url === uri;
      });

      const objectIdToUpdate = new Realm.BSON.ObjectId(myObject?._id);
      updateIsOnlineWithRealm(objectIdToUpdate, true);

      const updatedImageList = imageListCopy.map(image => {
        if (image.uri === uri) {
          return {...image, isOnline: true};
        }
        return image;
      });
      const updatedImageListForProgress = imgProgressListCopy.map(image => {
        if (image.uri === uri) {
          return {...image, progress: 1};
        }
        return image;
      });
      setImgProgressList(updatedImageListForProgress);
      setImagesList(updatedImageList);
      console.log('Offlie Image uploaded to the bucket!');
    });
  };

  const uploadImage = async (image: Asset) => {
    handleImageWithRealm(image, false);
  };

  useEffect(() => {
    let alreadyConnected: boolean = false;

    const unsubscribe = NetInfo.addEventListener(async state => {
      if (state.isConnected && state.isInternetReachable && !alreadyConnected) {
        alreadyConnected = true;
        console.log('Iamgess', JSON.stringify(imagesList));
        console.log('data', JSON.stringify(data));

        const firstDeleteItem = data.find(item => item.isDeleted);

        console.log('firstDeleteItem', JSON.stringify(firstDeleteItem));

        if (data.length) {
          if (firstDeleteItem) {
            console.log('firstDeleteItem2', JSON.stringify(firstDeleteItem));

            await deleteOfflineDeletedFile(firstDeleteItem);
          }
        }
      } else if (!state.isConnected) {
        alreadyConnected = false;
      }
    });
    return () => {
      unsubscribe();
    };
  }, [data]);

  useEffect(() => {
    const fetchData = async () => {
      const firstDeleteItem = data.find(item => item.isDeleted);

      console.log('useEffectDeleteItem', JSON.stringify(firstDeleteItem));

      if (data.length) {
        if (firstDeleteItem) {
          console.log('useEffectDeleteItem2', JSON.stringify(firstDeleteItem));

          await deleteOfflineDeletedFile(firstDeleteItem);
        }
      }

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

        const firstOnlineItem = data.find(item => !item.isOnline);
        //const firstDeleteItem = data.find(item => item.isDeleted);

        //console.log('firstDeleteItem', JSON.stringify(firstDeleteItem));

        if (data.length) {
          if (firstOnlineItem) {
            await handleOfflineImagesWithiFirebaseStorage(firstOnlineItem.url);
          }
        }

        // if (data.length) {
        //   if (firstDeleteItem) {
        //     console.log('firstDeleteItem2', JSON.stringify(firstDeleteItem));

        //     await deleteOfflineDeletedFile(firstDeleteItem);
        //   }
        // }
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
            fileName: await ref.fullPath.replace('images/', ''),
          };

          handleImageWithRealm(mobj, true);

          return mobj;
        }),
      );

      const myOfflineData = data.filter(item => {
        return !item.isOnline && !item.isDeleted;
      });

      const localUrls = await Promise.all(
        myOfflineData.map(async ref => {
          const mobj: ImageSet = {
            uri: ref.url,
            isOnline: ref.isOnline,
            fileName: ref.name,
          };
          return mobj;
        }),
      );

      if (myOfflineData) {
        const finalUrls = [...localUrls, ...urls];
        setImagesList(finalUrls);
      } else {
        setImagesList(urls);
      }

      console.log('imageRefsIF', 'called');
    } else {
      const myOfflineData = data.filter(item => {
        return !item.isDeleted;
      });

      const localUrls = await Promise.all(
        myOfflineData.map(async ref => {
          const mobj: ImageSet = {
            uri: ref.url,
            isOnline: ref.isOnline,
            fileName: ref.name,
          };
          return mobj;
        }),
      );

      if (myOfflineData) {
        setImagesList(localUrls);
      }

      console.log('imageRefsElse', 'call');
    }
  };

  const deleteOfflineDeletedFile = async (item: any) => {
    const netInfoState = await NetInfo.fetch();
    const isConnected = netInfoState.isConnected;
    if (isConnected) {
      console.log('deleteOfflineDeletedFile', JSON.stringify(item));

      const imageRef = storage().ref(`images/${item.name}`);
      imageRef
        .delete()
        .then(() => {
          DeleteObjectFormRealm(item?.url);
          console.log('Image deleted successfully.');
        })
        .catch(error => {
          console.log('Error deleting image:', error);
        });
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
        DeleteObjectFormRealm(item?.uri);
        const imageRef = storage().ref(`images/${item.fileName}`);
        imageRef
          .delete()
          .then(() => {
            console.log('Directly Image deleted successfully.');
          })
          .catch(error => {
            console.log('Error deleting imageDirectly:', error);
          });
        const updatedImageList = imageListCopy.filter(i => {
          return i.uri !== item?.uri;
        });
        setImagesList(updatedImageList);
      } else {
        console.log('datacop', data);

        const myObject = data.find(dataItem => {
          return dataItem.url === item?.uri;
        });

        console.log('datacop1', myObject);

        const objectIdToUpdate = new Realm.BSON.ObjectId(myObject?._id);
        UpdateDeleteObjectinRealm(objectIdToUpdate, true);

        const updatedImageList = imageListCopy.filter(i => {
          return i.uri !== item?.uri;
        });
        setImagesList(updatedImageList);
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
          <Image style={styles.image} source={{uri: item?.uri}} />
          <View style={styles.onlineOfflineIconPosition}>
            <Image
              source={
                item?.isOnline
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
        {imgProgressList.map(imgProgress => {
          if (imgProgress.uri == item?.uri) {
            if (!item?.isOnline) {
              return (
                <View style={styles.progressBarContainer}>
                  <ProgressView
                    progressTintColor="orange"
                    trackTintColor="blue"
                    progress={imgProgress.progress}
                  />
                </View>
              );
            }
          }
        })}
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
            placeholderTextColor={'gray'}
            style={styles.textInputStyle}
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
                <Text style={styles.deleteOrCancelText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalButtonContainers}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setSelectedForCancel('');
                }}>
                <Text style={styles.deleteOrCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MainScreen;
