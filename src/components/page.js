import React from "react";

const page = (Page) => {
  return (
    class PageWrapper extends React.Component {
      render(props) {
        return (
          <Page props= {props}/>
        )
      }
    }
  )
}
export default page;


