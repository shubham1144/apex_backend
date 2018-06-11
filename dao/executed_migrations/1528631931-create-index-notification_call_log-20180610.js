/* Migration file associated with creation of users*/

module.exports = [
`
    CREATE INDEX eID ON Plans.Subscriptions.Domains.Forms.Enquiry.CallLogs(eID)
`
];