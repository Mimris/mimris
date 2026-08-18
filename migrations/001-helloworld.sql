-- Up

CREATE TABLE Person ( 
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, 
    email TEXT, 
    password TEXT,
    session TEXT
);


CREATE TABLE Vehicle ( 
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT, model TEXT, 
    ownerId INTEGER REFERENCES Person(id)
);

CREATE TABLE Usersession ( 
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, 
    focus Text,
    ownerId INTEGER REFERENCES Person(id)
);

-- INSERT INTO Person (name, email, password) values('snorre','sf@noe.com', '123');
INSERT INTO Vehicle (brand, model, ownerId) values('BMW','I28',1);
INSERT INTO Vehicle (brand, model, ownerId) values('VW','Boble',1);
INSERT INTO Vehicle (brand, model, ownerId) values('Opel','V8',2);
INSERT INTO Vehicle (brand, model, ownerId) values('Volvo','PV',3);

INSERT INTO Usersession (name, focus, ownerId) values('1st Sesssion',
'{"phData":null,
"phFocus":{"gojsModel":null,"gojsMetamodel":{"nodeDataArray":[{"key":0,"text":"IRTV Type","color":"lightblue","loc":"0 0"},{"key":1,"text":"AMAP Type","color":"lightred","loc":"0 -80"}],
"linkDataArray":[]},"focusModel":{"id":"null","name":"null"},
"focusObject":{"id":"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656","name":"Default","sourceName":"test","status":null},
"focusModelview":{"id":null,"name":null},"focusOrg":{"id":0, "name":"Default"},
"focusProj":{"id":0, "name":"Default"},
"focusRole":{"id":"UUID4_93ABC7D8-2840-41EE-90F5-042E4A7F9FFF","name":"Default"},"focusCollection":null,
"focusTask":{"id":"UUID4_8214CE30-3CD8-4EFB-BC6E-58DE68F97656","name":"Default",
"focus":{"focusObject":{"id":"UUID4_A416FE57-F1A3-4D56-A534-E43C87508465","name":"Default"},
"focusSource":{"id":999,"name":"traversed"},
"focusCollection":[]}},
"focusSource":{"id":8, "name":"objectviews"}}}',
1);

-- Down
DROP TABLE Person;
DROP TABLE Vehicle;
DROP TABLE Usersession;