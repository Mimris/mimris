// @ts-nocheck
const fetch = require('node-fetch').default;

export const type = async (otype: any) => {
  
  const map = new Map([
      ['User', users()],
      ['Role', roles()]
      // [otype, [{id: '1', name: 'nsorre'}]]
    ]
  )
  const arr = map.get(otype)
  return arr
}

export const users = async () =>  {
  let response = await fetch('https://jsonplaceholder.typicode.com/users')
  const users = await response.json()
  return users
}

export const roles = async () =>  {
  let response = await fetch('http://localhost:4000/akmmodels')
  const phData = await response.json()
  const roles = phData?.models[5]?.objects?.map(o => (o.id && o.typeRef === "1ce4ebe9-27d2-46bb-f998-9ff0de6c9558") && { 'id':  o?.id, 'name': o?.name} ).filter(Boolean)
  console.log('46', roles);
  
  return roles
}
