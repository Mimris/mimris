// @ts-nocheck
import {useSelector} from 'react-redux';
import { NextPageContext } from "next";
import { myGet } from "../defs/myGet";
import Layout from '../components/Layout';
import Link from 'next/link';

export default function People({people} : any) {
    // console.log('7 people', people);
    const user = useSelector(state => state.phUser?.focusUser)
    return (
        <>
            <Layout user={user} >
                <Link href="/settings">
                    <a>Back</a>
                </Link>
                <h3>User list:</h3> 
                <div>{JSON.stringify(people)}</div>
            </Layout>
        </>
    )
}

People.getInitialProps = async (ctx: NextPageContext) => {
    const json = await myGet('/api/people', ctx);
    return {people: json};
}
