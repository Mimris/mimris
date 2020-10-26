// ./pages/_document.js
// _document is only rendered on the server side and not on the client side
// Event handlers like onClick can't be added to this file

import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <meta name="viewport" content="initial-scale = 0.8, maximum-scale = 1.0" />
        <meta charSet="utf-8" />
        <title>AKM Modelling Platform</title>
        <meta name="description" content="AKM Modelling Platform is the base modelling tool for making Active Knowlege Models. It is built on the ideas and methods used in the Metis modelling tool developed by Metis in the 1990's. AKMM is built with modern web technologies like React, Nextjs, Redux, Nodejs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* <meta name="viewport" content="height=device-height, initial-scale=1" /> */}

        <Head>
          <link
            rel="stylesheet"
            href="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
            integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh"
            crossOrigin="anonymous"
          />
            <style>{`body { margin: 0 } /* custom! */`}</style>    
            {/* <style>{ `.dialog {display: none}}    `}</style> */}

        </Head>
        
        <body className="custom_class">
          <Main />
          <NextScript />
          {/* <link rel="stylesheet" href="https://unpkg.com/bootstrap-material-design@4.1.1/dist/css/bootstrap-material-design.min.css" integrity="sha384-wXznGJNEXNG1NFsbm0ugrLFMQPWswR3lds2VeinahP8N0zJw9VWSopbjv2x7WCvX" crossorigin="anonymous"></link> */}
          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" /> 
          <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
          <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>

          {/* <script src="../ui/ui_modals.js"></script> */}

        </body>
      </Html>
    )
  }
}

export default MyDocument









// // ./pages/_document.js
// // _document is only rendered on the server side and not on the client side
// // Event handlers like onClick can't be added to this file

// import Document, { Html, Head, Main, NextScript } from 'next/document'
// import "../styles/styles.css"
// class MyDocument extends Document {
//   static async getInitialProps(ctx) {
//     const initialProps = await Document.getInitialProps(ctx)
//     return { ...initialProps }
//   }

//   render() {
//     return (
//       <Html>
//         <meta name="viewport" content="initial-scale = 0.8,maximum-scale = 1.0" />
//         <Head>
//          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" />
//          <style>{`body { margin: 0 } /* custom! */`}</style>     
//         </Head>
//         <body className="custom_class">
//           <Main />
//           <NextScript />
//           <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" /> 
//           <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
//           <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
//           <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
//         </body>
//       </Html>
//     )
//   }
// }

// export default MyDocument

