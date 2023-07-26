import {StyleSheet, Dimensions} from 'react-native';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  listContainer: {
    alignSelf: 'flex-start',
    flex: 1,
    marginHorizontal: 11,
  },
  searchBarContainer: {
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 50,
    marginHorizontal: 10,
  },
  buttonContainer: {
    padding: 10,
    width: '90%',
    marginVertical: 10,
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
  },
  searchTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  modalItem: {
    padding: 15,
  },
  modalText: {
    color: 'black',
  },
  deleteOrCancelText: {
    color: 'white',
  },
  modalSeparator: {
    backgroundColor: 'grey',
    borderWidth: 0.5,
    width: '100%',
  },
  imageContainer: {
    margin: 3,
    alignSelf: 'flex-start',
    borderRadius: 15,
  },
  image: {
    width: (Dimensions.get('window').width - 50) / 3,
    height: (Dimensions.get('window').width - 50) / 3,
    borderRadius: 15,
  },
  searchText: {
    color: 'white',
  },
  progressBarContainer: {
    marginTop: 5,
  },
  deleteTextHeading: {
    color: 'black',
    fontSize: 18,
    paddingVertical: 20,
  },
  deleteContainer: {
    flexDirection: 'row',
    margin: 10,
  },
  deleteModalButtonContainers: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'green',
    padding: 5,
    margin: 5,
  },
  textInputStyle: {
    color: 'white',
  },
  iconSizes: {height: 23, width: 23},
  cancelIconPosition: {position: 'absolute', top: 5, right: 5},
  onlineOfflineIconPosition: {position: 'absolute', bottom: 5, right: 5},
});

export {styles};
