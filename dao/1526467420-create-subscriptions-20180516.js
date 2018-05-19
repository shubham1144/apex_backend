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
`
];
