import { connect } from 'react-redux';
import Page from '../components/page';

const page = (props: any) => {
  return (
    <div>
      <h1 className="title">Heroku test</h1>
    </div>
  )
}

export default Page(connect(state => state)(page));