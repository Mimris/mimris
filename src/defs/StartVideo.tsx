// @ts-nocheck


export const StartVideo = (props) => {
  return (
    <div>
      <video>
        <source src={props.videoURI} type="video/mp4" target="_blank"/>
      </video>
    </div>
  )
}




