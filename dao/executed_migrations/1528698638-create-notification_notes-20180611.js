/* Migration file associated with creation of enquiry notes*/

module.exports = [
`
    CREATE TABLE Plans.Subscriptions.Domains.Forms.Enquiry.Notes (
        nID STRING,
        nCreatedAt STRING,
        nUpdatedAt STRING,
        nUserDetails RECORD(
            first_name STRING,
            last_name STRING,
            user_id STRING,
            user_contact STRING
        ),
        nNote STRING,
        PRIMARY KEY (nID)
    )
`
];