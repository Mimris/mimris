import { connect } from 'react-redux';
import Page from '../components/page';
import Layout from '../components/Layout';

const page = (props: any) => {
  return (

    <div>
      <Layout user={props.phUser?.focusUser} >
        <h1 className="title">Heroku test</h1>
      </Layout>
    </div>
  )
}

export default Page(connect(state => state)(page));