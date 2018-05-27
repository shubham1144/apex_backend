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
        eCreatedAt STRING,
        eFormAllDetails STRING,
        eFormLinkedDetails STRING,
        PRIMARY KEY (eID)
    )
`
,`
    CREATE TABLE Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs (
        clID STRING,
        clStatus ENUM(NotCalled, Called, Engaged, NotReachable),
        clCreatedAt STRING,
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
`,
`
    CREATE INDEX dID ON Plans.Subscriptions.Domains(dID)
`
];