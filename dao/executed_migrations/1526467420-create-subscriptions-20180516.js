/* Migration file associated with creation of users*/

module.exports = [
`
    CREATE TABLE IF NOT EXISTS Plans(
        pID STRING,
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
        sID STRING,
        uID STRING,
        sStartDate INTEGER,
        sEndDate INTEGER,
        sIsActive BOOLEAN,
        sParentID INTEGER,
        users ARRAY(STRING),
        PRIMARY KEY (sID)
    )
`,
`
    CREATE TABLE IF NOT EXISTS Plans.Subscriptions.Domains(
        dID STRING,
        dDisplayName STRING,
        dKey STRING,
        dStatus BOOLEAN,
        dVerified BOOLEAN,
        dUrl STRING,
        dIsPingAllowed BOOLEAN,
        dCreatedByUID STRING,
        dCreatedAtDate INTEGER,
        dUpdatedAtDate INTEGER,
        PRIMARY KEY (dID, dCreatedByUID)
    )
`,
`
    CREATE TABLE Plans.Subscriptions.Domains.Forms (
        dfID STRING,
        dfName STRING,
        users ARRAY(STRING),
        PRIMARY KEY (dfID)
    )
`,
`
    CREATE TABLE Plans.Subscriptions.Domains.Forms.FormFields (
        dffID STRING,
        dffValue STRING,
        PRIMARY KEY (dffID)
    )
`,
];
