const fs = require('fs');
const got = require('got')
const credentials = {
	client: {
		id: 'b889fbbd24fff204cc72870ef4edc3326960de9c3c587a5cad5296b36f806486',
		secret: '48cded28c7c995e990862b8843d1d9ada91ceb0db490cdf14ac0d6717f05fcbe'
	},
	auth: {
		tokenHost: 'https://api.intra.42.fr'
	}
};
const oauth2 = require('simple-oauth2').create(credentials);
const config = {
	promo: "2019-09-ben"
};
(async () => {
	let filtered = [];
	let token;
	let currentPromo;
	const inPromo = user => {
		const regex = new RegExp(user);
		return (Boolean(currentPromo.match(regex)));
	}
	const baseUrl = "https://api.intra.42.fr"
	let page = 1;
	const gibUsers = async (page) => new Promise(async (res, rej) => {
		try {
			const users = (await got(`/v2/cursus/21/cursus_users?filter[campus_id]=21&page[number]=${page}&page[size]=100`, {
				baseUrl,
				headers: {
					Authorization: `Bearer ${token}`,
				},
				json: true
			})).body;
			if (!users.length)
				res(false);
			currentPromo = fs.readFileSync(`promo${config.promo}`, 'utf8', (err, data) => {
				if (err) throw err;
				return (data);
			});
			users.forEach(element => {
				if (inPromo(element.user.login))
					filtered.push(element);
			});
			res(true);
		} catch (err) {
			rej(err)
		}
	})
	try {
		const result = oauth2.clientCredentials.getToken();
		const accessToken = oauth2.accessToken.create(await result);
		token = accessToken.token.access_token;
	} catch (error) {
		console.log('Access Token error', error.message);
	}
	while (await gibUsers(page++))
		;


	const averageLevel = () => {
		let score = 0;
		filtered.forEach(element => {
			score += element.level;
		});
		return (score /= (filtered.length));
	}
	const getPoints = () => new Promise(async (res, rej) => {
		let points = 0;
		for (let index = 0; index < filtered.length; index++) {
			const element = filtered[index];
			const delay = interval => new Promise(resolve => setTimeout(resolve, interval));
			await delay(2000);
			try {
				const response = (await got(`/v2/users/${element.user.id}`, {
					baseUrl,
					headers: {
						Authorization: `Bearer ${token}`,
					},
					json: true
				})).body;
				points += response.correction_point;
				console.log(`Added ${response.correction_point} from ${response.login}`)
			} catch (e) {
				console.error(e)
				rej(e)
			}
		}
		res(points);
	})
	const isLabourseTnakt = user => {
		filtered.forEach(element => {
			if (element.user.login === user) {
				if (averageLevel() > element.level) {
					console.log("tnakt, boyo gal la")
					return (true);
				} else {
					console.log("3rbi gal l boyo ah")
					return (false);
				}
			}
		});
	}
	switch (process.argv[2]) {
		case "average":
			console.log(averageLevel()); break;
		case "points": {
			try {
				let points = await getPoints();
				console.log(points, `with an average of ${points / filtered.length}`); break;
			} catch (e) {
				console.log(e)
			}
		}
		default:
			isLabourseTnakt(process.argv[2])
	}
})();
