module.exports = {
    BCRYPT : {
        SALT_ROUNDS : 10
    },
    JWT : {
        SECRET : 'LL3LksumXgHbyPx3BnPACAV96JgvntmkEGhfJUsfq',
        AUDIENCE : 'apex.com',
        ISSUER : 'apex.ae',
        JWTID : 'yYdw9DUsEk55SqRJ',
        EXPIRES_IN: 259200,//3 days
        THRESHOLD_FACTOR : 0.33//1 day

    },
    PAGINATION : {
        DEFAULT_PAGE : 1,
        DEFAULT_ROW_COUNT : 10
    },
    USER : {
        PROFILE_FOLDER : '/files/avatars/'
    }
};