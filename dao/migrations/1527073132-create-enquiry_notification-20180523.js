/* Migration file associated with creation of users*/

module.exports = [
`
    CREATE TABLE Plans.Subscriptions.Domains.Forms.Enquiry (
        eID STRING,
        ePhone STRING,
        eEmail STRING,
        eStatus ENUM(Unread, Read, Engaged, NotReachable),
        eIsArchived BOOLEAN,
        eIsDeleted BOOLEAN,
        eCreatedAt INTEGER,
        eFormAllDetails STRING,
        eFormLinkedDetails STRING,
        PRIMARY KEY (eID)
    )
`
,`
    CREATE TABLE Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs (
        clID STRING,
        clStatus STRING,
        clCreatedAt INTEGER,
        clUserDetails RECORD(
            firstname STRING,
            lastname STRING,
            user_id STRING,
            user_contact STRING
        ),
        clNote STRING,
        PRIMARY KEY (clID)
    )
`,
`
    CREATE INDEX eID ON Plans.Subscriptions.Domains.Forms.Enquiry(eID)
`,
`
    CREATE INDEX dfID on Plans.Subscriptions.Domains.Forms(dfID)
`
];