/**
 * Importing the dependancies
 */
var express = require('express'),
	mysql = require('mysql'),
	router = express.Router(),
	login = require('./../../helpers/login'),
	databaseConfig = require('./../../config/database'),
	getCopyrightDate = require('./../../helpers/copyright'),
	formater = require('./../../helpers/formater');



/**
 * Configurations
 */
var conn = mysql.createConnection({
	database: databaseConfig.name,
	host: databaseConfig.host,
	password: databaseConfig.password,
	user: databaseConfig.user,
	multipleStatements: true
});



/**
 * Connecting to the database
 */
conn.connect();



/**
 * Using the login middleware
 */
router.use(login);



/**
 * Routing
 */

// Setting up the brands route.
router.get('/', function (req, res) {
	conn.query(
		'\
        SELECT `PrimaryNumber`, `SecondaryNumber`, `FixedNumber`, `Email`, `Facebook`, `Instagram`, `Youtube` FROM `Config`;\
        SELECT * FROM `Categories` WHERE `Deleted` = 0;\
        SELECT COUNT(`MailID`) AS `NewMail` FROM `Mail` WHERE `Read` = 0;\
        SELECT * FROM `Brands` WHERE `Deleted` = 0 ORDER BY `BrandName` ASC;\
        SELECT * FROM `Brands` WHERE `Deleted` = 1 ORDER BY `BrandName` ASC;\
    ',
		(error, results) => {
			// Checking if there are any errors.
			if (error) throw error;

			// Getting the data.
			const data = {
				Config: {
					Phone: {
						Primary: results[0][0].PrimaryNumber,
						Secondary: results[0][0].SecondaryNumber,
						Fixed: results[0][0].FixedNumber
					},
					Email: results[0][0].Email,
					Facebook: {
						Name: results[0][0].Facebook.split('|')[0],
						Link: results[0][0].Facebook.split('|')[1]
					},
					Instagram: {
						Name: results[0][0].Instagram.split('|')[0],
						Link: results[0][0].Instagram.split('|')[1]
					},
					Youtube: {
						Name: results[0][0].Youtube.split('|')[0],
						Link: results[0][0].Youtube.split('|')[1]
					}
				},
				Categories: formater.groupCategories(results[1]),
				NewMail: results[2][0].NewMail,
				Brands: results[3],
				DeletedBrands: results[4]
			};

			// Getting the proper copyright date.
			data.CopyrightDate = getCopyrightDate();

			// Rendering the brands page.
			res.render('dashboard/brands', {
				Data: data,
				Messages: {
					Brand: req.flash('brand-flash')
				}
			});
		}
	);
});

// Setting the brand creation route.
router.post('/', function (req, res) {
	const stmt = conn.format('INSERT INTO ?? (??, ??) VALUES (?, ?);', [
		'Brands',
		'BrandName',
		'Logo',
		req.body['brand-name'],
		req.body['brand-logo']
	]);

	conn.query(stmt, (error, results) => {
		// Checking if there are any errors.
		if (error) throw error;

		// Setting up the flash message.
		req.flash('brand-flash', 'تم إنشاء العلامة التجارية بنجاح');

		// Rendering the brands page.
		res.redirect('/dashboard/brands');
	});
});

// Setting up the brand edition route.
router.put('/', function (req, res) {
	const stmt = conn.format('UPDATE ?? SET ?? = ?, ?? = ? WHERE ?? = ?;', [
		'Brands',
		'BrandName',
		req.body['brand-name'],
		'Logo',
		req.body['brand-logo'],
		'BrandID',
		req.body['brand-id']
	]);

	conn.query(stmt, (error, results) => {
		// Checking if there are any errors.
		if (error) throw error;

		// Setting up the flash message.
		req.flash('brand-flash', 'تم تحديث العلامة التجارية بنجاح');

		// Rendering the brands page.
		res.redirect('/dashboard/brands');
	});
});

// Setting up the deletion route.
router.delete('/', function (req, res) {
	var brandId = req.body['brandId'],
		stmt = conn.format('UPDATE ?? SET ?? = 1 WHERE ?? = ?;', [
			'Brands',
			'Deleted',
			'BrandID',
			brandId
		]);

	conn.query(stmt, (error, results) => {
		// Checking if there are any errors.
		if (error) throw error;

		// Setting up the flash message.
		req.flash('brand-flash', 'تم حذف العلامة التجارية بنجاح');

		// Signaling the client.
		res.send();
	});
});

// Setting up the restoration route.
router.put('/restore', function (req, res) {
	var brandId = req.body['brandId'],
		stmt = conn.format('UPDATE ?? SET ?? = 0 WHERE ?? = ?;', [
			'Brands',
			'Deleted',
			'BrandID',
			brandId
		]);

	conn.query(stmt, (error, results) => {
		// Checking if there are any errors.
		if (error) throw error;

		// Setting up the flash message.
		req.flash('brand-flash', 'تمت استعادة العلامة التجارية بنجاح');

		// Signaling the client.
		res.send();
	});
});

// Exporting the route.
module.exports = router;
