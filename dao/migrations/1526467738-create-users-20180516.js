/* Migration file associated with creation of users*/

module.exports = [
`
    CREATE TABLE IF NOT EXISTS Users(
        uID STRING,
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
        PRIMARY KEY (uID)
    )
`,
` CREATE INDEX uEmail on Users(uEmail)`,
`
    CREATE TABLE Users.UserAttributes (
        uaKey STRING,
        uaValue STRING,
        PRIMARY KEY (uaKey)
    )
`,
 `
     CREATE TABLE Users.UserDevices (
         udToken STRING,
         udType STRING,
         udLastUsed INTEGER,
         PRIMARY KEY (udToken)
     )
`
];
