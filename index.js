const sqlite3 = require('sqlite3').verbose();
const fs = require("fs");
const _ = require('underscore');
const folder = (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share")) + '\\TeamSpeak';

let contacts = [];
let count_files = 0;
let count_exported = 0;
let profiles;

function getDirectories(path) {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path+'/'+file).isDirectory();
  });
};

function getFiles(path) {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path+'/'+file).isFile();
  });
};

function saveFile(filename, content) {
	fs.writeFile(filename, content, function (err) {
	  if (err) return console.log(err);
	});
}

function readDB(path, file, profile) {
	let db = new sqlite3.Database(path);
	let query = 'SELECT * FROM Contacts';
	contacts[profile] = [];
	db.all(query, function(err, row) {
		if (row) {
			for(let i = 0; i < row.length; i++) {
				contacts[profile].push(((row[i].display_name !== '') ? row[i].display_name : 'None') + '	' + row[i].alias);
			}
		}
		count_exported++;
		if(count_exported >= count_files) {
			Object.keys(contacts).forEach(function(key) {
				var val = contacts[key];
				saveFile(key + '.txt', _.uniq(contacts[key]).join('\r\n'));
			});
		}
	});
};

if (fs.existsSync(folder)) {
	profiles = getDirectories(folder);
};

for (let i = 0;i < profiles.length; i++) {
	if (fs.existsSync(folder + '\\' + profiles[i])) {
		let files = getFiles(folder + '\\' + profiles[i]);
		for (let f = 0; f < files.length; f++) {
			if(files[f].match(/([a-zA-Z0-9\S\-\(\)]*\.db)/g) && !files[f].match(/.*settings.*/) && !files[f].match(/.*journal.*/)) {
				count_files++;
				readDB(folder + '\\' + profiles[i] + '\\' + files[f], files[f], profiles[i]);
			}
		}
	}
}
