    // remove all but - and text from  "^[\\w\\-\\.]+:master-data\\-\\-Organisation:[\\w\\-\\.\\:\\%]+:[0-9]*$"

    const removePrePostfix = (str) => {
        console.log('før ' , str)

        str.replace('\^', '')


        console.log('ett ', str)
        return str
    }


    
    console.log('124', removePrePostfix("^[\\w\\-\\.]+:master-data\\-\\-Organisation:[\\w\\-\\.\\:\\%]+:[0-9]*$"));