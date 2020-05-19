// @ts-nocheck
// Diagram.tsx

// import React from "react";
import React, { useEffect, useLayoutEffect } from "react";
import { connect, useSelector, useDispatch } from 'react-redux';
import Page from './page';
import Palette from "./Palette";
import Modeller from "./Modeller";
import genGojsModel from './GenGojsModel'
// import {loadDiagram} from './akmm/diagram/loadDiagram'

const page = (props: any) => {

  console.log('12', props);
  const dispatch = useDispatch()

  /**  * Get the state from the store  */
  const state = useSelector((state: any) => state) // Selecting the whole redux store
  const focusModelview = useSelector(focusModelview => state.phFocus.focusModelview)
  let gojsmodel = state.phFocus.gojsModel
  let gojsmetamodel = state.phFocus.gojsMetamodel
  let metis = state.phData?.metis
  let myMetis = props.phMymetis?.myMetis
  // console.log('23 phFocus', state.phFocus);
  // console.log('23 phData', state.phData);

  // console.log('24', gojsmetamodel ); 

  useEffect(() => {
    genGojsModel(state, dispatch);
    // gojsmodel = state.phFocus.gojsModel;
    // gojsmetamodel = state.phFocus.gojsMetamodel;
    // metis = props.phData?.metis
    // myMetis = props.phMymetis?.myMetis
  }, [focusModelview])

  console.log('53', myMetis);

  return (
    <>
      <div className="workpad">
        {/* <div className="myPalette pl-1 text-white bg-secondary bg-lighting" id="lighten" > */}
        <div className="myPalette pl-1 text-white bg-secondary bg-lighting" id="lighten" style={{ maxWidth: "300px", height: "80vh", marginRight: "2px", backgroundColor: "whitesmoke", border: "solid 1px black" }}>
          <Palette
            gojsModel={gojsmodel}
            gojsMetamodel={gojsmetamodel}
            myMetis={myMetis}
            metis={metis}
            dispatch={dispatch}
          />
          <div className="instances"> {/* area for all instance or result of query*/}
            {/* {instances} */}
          </div>
        </div>
        {/* <div className="myModeller pl-1" > */}
        <div className="myModeller pl-1" style={{ flexGrow: 1, width: "100%", height: "80vh", border: "solid 1px black" }}>
          <div>
            {/* <h5>AKM Modeller</h5> */}
            <div>
              {/* {modellerDiv} */}
              <Modeller
                gojsModel={gojsmodel}
                gojsMetamodel={gojsmetamodel}
                myMetis={myMetis}
                metis={metis}
                dispatch={dispatch}
              />
            </div>
          </div>
        </div>
        <style jsx>{`
          .workpad {
            grid-area: workpad;
            display: grid ;
            border-radius: 5px 5px 0px 0px;
            height: 100%;
            width: 100%;
            // max-width: 400px;
            grid-template-columns: auto 3fr;
            grid-template-areas:
            "myPalette myModeller";
          }
          @media only screen and (max-width: 475px) {
          .workpad {
              grid-area: workpad;
              display: grid ;
              border-radius: 5px 5px 0px 0px;
              width: 100%;
              // max-width: 400px;
              grid-template-columns: auto 3fr;
              grid-template-areas:
              "myPalette"
              "myModeller";
            }
          }
          .myPalette {
            grid-area: myPalette;
            margin: 2px;
            padding-right: 3px;
            height: 100%;
            // min-height: 50vh;
            border-radius: 5px 5px 0px 0px;
            background-color: #ddd; 
            // max-width: 200px;    
            // min-width: 400px;
          }
          .myModeller {
            grid-area: myModeller;
            height: 100%;
            margin: 2px;
            padding-right: 3px;
            border-radius: 5px 5px 0px 0px;
            background-color: #eee;
            // width: 100%;
            // max-width: 300px;
          }
          //   .wp-topbar {
          //     white-space: wrap;
          //     background-color: #f3d8d882;
          //     color: #aaa;
          //     border: 1px;
          //     border-color: #fff;
          //     border-radius: 5px 5px 0px 0px;
          //     margin: 1px;
          //     max-width: 100hw;
          //   }
          //   .wp-nav {
          //     grid-area: wp-nav;
          //     background-color: #aaf;
          //     color: #fff;
          //     border-radius: 5px 5px 5px 5px;
          //     margin: 1px;
          //     transition: all 1s;

          //   }
          // .wp-main {
          //   grid-area: wp-main;
          //   border-radius: 5px 5px 5px 5px;
          //   margin: 1px;
          //   padding: 2px;
          //   // height: 100%;
          //   object-fit: cover;
          //   word-wrap: break-word;
          //   grid-gap: 2px;
          //   grid-template-columns: auto;
          //   grid-template-areas:
          //   "myPalette myModeller"
          //   "myPalette myModeller";
          // }
          // .wp-bottombar {
          //   border-radius: 5px 5px 5px 5px;
          //   margin: 1px
          // }
        `}</style>
      </div>
    </>
  )
}
export default Page(connect(state => state)(page));
