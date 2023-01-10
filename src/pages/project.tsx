// make a page for project
import { connect, useDispatch } from 'react-redux';
import { loadData } from '../actions/actions'
import Page from '../components/page';
import Layout from '../components/Layout';
import Header from "../components/Header"
import Footer from "../components/Footer"
import SetContext from '../defs/SetContext'
import ProjectForm from '../components/ProjectForm';
import LoadGithubParams from '../components/loadModelData/LoadGithubParams';

const page = (props: any) => {
    
      console.log(props)
      const dispatch = useDispatch()
    
      // if (!props.phData) {
      //   dispatch(loadData())
      // }
    
      // const state = useSelector(state => state)
    
      // const metis = (state.phData) && state.phData.metis
    
      // const [visibleTasks, setVisibleTasks] = useState(true)
      // function toggleTasks() {
      //   setVisibleTasks(!visibleTasks);
      // }
    
      // /**
      // * Set up the Context items and link to select Context modal,
      // */
      const setContextDiv = (props.phFocus) && <SetContext phF={props.phFocus} />
    
      return (
     <div>
        <Layout user={props.phUser?.focusUser} >
          <div id="index" >
             <div className="wrapper">
                {/* <div className="header">
                  <Header title='eaderTitle' />
                </div> */}
                <div className="workplace">
                  <div className="workarea bg-secondary">
                      <div className="m-5">
                          <LoadGithubParams phFocus={props.phFocus} repo='https://github.com/Kavca/kavca-akm-models' branch= 'main' file='PROD-STRUCT.json' />
                    </div>
                    </div>
                </div>
                <div className="context">
                  <div className="context-area bg-secondary">
                      <div className="m-5">
                          <ProjectForm phFocus={props.phFocus} />
                    </div>
                    </div>
                </div>
                {/* <div className="footer">
                  <Footer />
                </div> */}
             </div>
          </div>
        </Layout>
     </div>
      )
    }

    export default connect((state: any) => state)(page)
