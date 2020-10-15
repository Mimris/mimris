import fetch from 'isomorphic-unfetch';
import { NextPageContext } from "next";
import Router from 'next/router';

export async function myGet(url: string, ctx: NextPageContext) {
    const cookie = ctx.req?.headers.cookie;
    console.log('7 myGet', url);
    
    const resp = await fetch(url, {
        headers: {
            cookie: cookie!
        }
    });

    if(resp.status === 401 && !ctx.req) {
        // console.log('15', Router);      
        (Router.router) && Router.replace('/login');
        return {};
    }

    if(resp.status === 401 && ctx.req) {
        ctx.res?.writeHead(302, {
            Location: 'http://localhost:3000/login'
        });
        ctx.res?.end();
        return;
    }

    const json = await resp.json();
    return json;
}