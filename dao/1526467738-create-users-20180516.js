/* Migration file associated with creation of users*/

module.exports = [
`
    CREATE TABLE IF NOT EXISTS Users(
        uID INTEGER,
        uName STRING,
        uEmail STRING,
        uPassword STRING,
        uISActive BOOLEAN,
        uIsValidated BOOLEAN,
        UParentID INTEGER,
        uDateAdded INTEGER,
        uDateUpdated INTEGER,
        uType ENUM (User, Admin),
        uFirstName STRING,
        uLastName STRING,
        uLastLogin INTEGER,
        uLastLoginIP STRING,
        PRIMARY KEY (uEmail)
    )
`,
` CREATE INDEX uID on Users(uID)`,
`
    CREATE TABLE Users.UserAttributes (
        uaID INTEGER,
        uaKey STRING,
        uaValue STRING,
        PRIMARY KEY (uaID)
    )
`,
 `
     CREATE TABLE Users.UserDevices (
         udID INTEGER,
         udToken STRING,
         udType STRING,
         udLastUsed INTEGER,
         PRIMARY KEY (udID)
     )
`
];
