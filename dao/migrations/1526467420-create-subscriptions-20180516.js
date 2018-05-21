/* Migration file associated with creation of users*/

module.exports = [
`
    CREATE TABLE IF NOT EXISTS Plans(
        pID INTEGER,
        pName STRING,
        pDescription STRING,
        pActive BOOLEAN,
        pPrice NUMBER,
        pDetails RECORD (
            UserCount INTEGER,
            allowedPing BOOLEAN,
            DomainCount INTEGER
        ),
        PRIMARY KEY (pID)
    )
`,
`
    CREATE TABLE Plans.Subscriptions (
        sID INTEGER,
        uID INTEGER,
        sStartDate INTEGER,
        sEndDate INTEGER,
        sIsActive BOOLEAN,
        sParentID INTEGER,
        users ARRAY(INTEGER),
        PRIMARY KEY (sID)
    )
`,
`
    CREATE TABLE IF NOT EXISTS Plans.Subscriptions.Domains(
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
    CREATE TABLE Plans.Subscriptions.Domains.Forms (
        dfID INTEGER,
        dfName STRING,
        users ARRAY(INTEGER),
        PRIMARY KEY (dfID)
    )
`,
`
    CREATE TABLE Plans.Subscriptions.Domains.Forms.FormFields (
        dffID INTEGER,
        dffValue STRING,
        PRIMARY KEY (dffID)
    )
`
];
