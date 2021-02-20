// @ts-nocheck
import { useState } from 'react';

export const StartVideo = (props) => {

  //console.log('6', props);
  return (
    <>
      <video key={props.videoURI} controls>
        <source src={props.videoURI} type="video/mp4" />
      </video>
    </>
  )
}





// const [AutoPlay, setAutoPlay] = useState({});
// const Videos = [props.videoURI.videos]

// const onClickHandler = id => {
//   if (AutoPlay.hasOwnProperty(id)) {
//     if (AutoPlay[id] === true) {
//      setAutoPlay({...AutoPlay,[id]:false});    
//     } else {
//       setAutoPlay({...AutoPlay,[id]:true});
//     }
//   } else {
//     setAutoPlay({...AutoPlay,[id]:true});
//   }
// }
// console.log('23', Videos);

// return (
//   <>
//     {
//       Videos &&  Videos.map((result,index) => {
//         return (
//           <> 
//             <video controls key={index} autoplay={AutoPlay[index]===true}>
//               <source src={result} type="video/mp4" />
//             </video>
//             {/* <button onClick={() => onClickHandler(index)}>Play</button> */}
//           </>
//         )
//       })
//     }
//   </>
// )