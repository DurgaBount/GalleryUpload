import React, {createContext, useState} from 'react';

const ProgressContext = createContext();

const ProgressProvider = ({children}) => {
  const [imgsProgress, setImgsProgress] = useState([]);

  const updateProgress = progressObj => {
    setImgsProgress(prevImgsProgress => {
      const imgObject = prevImgsProgress.find(
        img => img.uri === progressObj.uri,
      );
      if (imgObject) {
        const updatedImgsProgress = prevImgsProgress.map(img => {
          if (img.uri === progressObj.uri) {
            return {...img, progress: progressObj.progress};
          }
          return img;
        });
        return updatedImgsProgress;
      } else {
        return [...prevImgsProgress, progressObj];
      }
    });
  };

  return (
    <ProgressContext.Provider value={{imgsProgress, updateProgress}}>
      {children}
    </ProgressContext.Provider>
  );
};

export {ProgressContext, ProgressProvider};
