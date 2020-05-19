import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { VehiclePerson } from '../../defs/VehiclePerson';

import fetch from 'isomorphic-unfetch'

export interface PersonProps {
  ownersList?: VehiclePerson[];
}

export default function Person({ ownersList }: PersonProps) {

  const router = useRouter();
  console.log('16 person', router.query.person);

  const [owners, setOwners] = useState(ownersList);
  console.log('18 person', owners);

  useEffect(() => {
    async function loadData() {
      const response = await fetch(
        'http://localhost:4050/vehicles?ownerName=' +
        router.query.person +
        '&vehicle=' +
        router.query.vehicle
        );
        const ownersList: VehiclePerson[] | undefined = await response.json();
        setOwners(ownersList);
      }
      
      if (ownersList?.length == 0) {
        loadData();
      }

    }, []);
    
    console.log('38 owners', owners);
    if (!owners?.[0]) {
      return <div>loading...</div>;
    }
    
    return <pre>{owners[0].vehicle}</pre>;
  }
  
  Person.getInitialProps = async ({query, req}: NextPageContext) => {
    console.log('50 req', req);
    if (!req) {
      return { ownersList: [] };
    }

    const response = await fetch(
      'http://localhost:4050/vehicles?ownerName=' +
        query.person +
        '&vehicle=' +
        query.vehicle
    );
    console.log('56 response', response);
    const ownersList: VehiclePerson[] | undefined = await response.json();
    return { ownersList: ownersList };
  };
