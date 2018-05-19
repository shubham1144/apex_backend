/* Migration file associated with creation of users*/

module.exports = [
`
    CREATE TABLE IF NOT EXISTS Domains(
        dID INTEGER,
        dDisplayName STRING,
        dKey STRING,
        dStatus BOOLEAN,
        dVerified BOOLEAN,
        dUrl STRING,
        disPingAllowed BOOLEAN,
        dCreatedByUID INTEGER,
        dCreatedAtDate INTEGER,
        dUpdatedAtDate INTEGER,
        PRIMARY KEY (dID, dCreatedByUID)
    )
`,
`
    CREATE TABLE Domains.Forms (
        dfID INTEGER,
        dfName STRING,
        PRIMARY KEY (dfID)
    )
`,
`
    CREATE TABLE Domains.Forms.FormFields (
        dffID INTEGER,
        dffValue STRING,
        PRIMARY KEY (dffID)
    )
`,
 `
     CREATE TABLE Domains.Forms.Users (
         uID STRING,
         PRIMARY KEY (uID)
     )
`
];
