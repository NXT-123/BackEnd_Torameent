class Team {
    constructor(id, name, logo, members) {
        this.id = id;
        this.name = name;
        this.logo = logo;
        this.members = members || [];
    }
}

module.exports = Team;