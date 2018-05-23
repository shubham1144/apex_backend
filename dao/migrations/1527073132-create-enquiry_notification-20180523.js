/* Migration file associated with creation of users*/

module.exports = [
`
    CREATE TABLE Plans.Subscriptions.Domains.Forms.Enquiry (
        eID STRING,
        ePhone STRING,
        eEmail STRING,
        eFormLinkedDetails ARRAY(JSON),
        eFormAllDetails JSON,
        eStatus ENUM(Unread, Read, Engaged, NotReachable),
        eIsArchived BOOLEAN,
        eIsDeleted BOOLEAN,
        eCreatedAt INTEGER,
        PRIMARY KEY (eID)
    )
`,
`
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
`
];