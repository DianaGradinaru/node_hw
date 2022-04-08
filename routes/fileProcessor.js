const multer = require("multer")({ dest: "uploads/" });
const fs = require("fs");
const { parse } = require("csv-parse/sync");

const readIDs = [];

function processor(req, res) {
    if (req.file.mimetype === "text/csv") {
        const data = readCSV(req.file);
        res.json(processCSV(data));
    } else if (req.file.mimetype === "application/json") {
        const data = readJSON(req.file);
        res.json(processJSON(data));
    }
}

function readJSON(file) {
    return JSON.parse(fs.readFileSync(file.path).toString());
}

function processJSON(data) {
    let output = {};

    if (readIDs.includes(data.id)) {
        output = { error: "Am mai citit acest ID" };
    }

    if (!data.id) {
        output = { error: "ID missing" };
    }

    if (data.resourceType !== "Practitioner") {
        output = { error: "Not a practitioner" };
    }

    readIDs.push(data.id);

    if (data.active && !output.error) {
        output = {
            name: data.name.map((n) => n.text).join(", "),
            facility: data.facility.map((f) => f.name).join(", "),
        };
    }

    console.log(output);
    return output;
}
function readCSV(file) {
    return parse(fs.readFileSync(file.path), {
        columns: true,
        delimiter: ",",
        trim: true,
        skip_empty_lines: true,
    });
}

function processCSV(data) {
    const output = {};

    const ordered = data.sort((a, b) =>
        parseInt(a.ID) < parseInt(b.ID) ? -1 : 1
    );

    for (let i = 1; i < ordered.length; i++) {
        const ids = ordered[i].ID === ordered[i - 1].ID;
        const fns = ordered[i].FamilyName !== ordered[i - 1].FamilyName;
        const gns = ordered[i].GivenName !== ordered[i - 1].GivenName;

        if (ids && (fns || gns)) {
            output = { error: `Multiple names for same ID (${ordered[i].ID})` };
            console.log(output);
            return output;
        }
    }

    for (let i in data) {
        const e = data[i];
        const name = `${e.FamilyName} ${e.GivenName}`;
        output[name] = data
            .filter(
                (x) =>
                    x.FamilyName === e.FamilyName &&
                    x.GivenName === e.GivenName &&
                    x.Active === "true"
            )
            .map((x) => x.NameId)
            .join(", ");
    }

    // console.log(output);
    // return output;

    const ret = Object.keys(output)
        .map((k) => k + ": " + output[k])
        .join("\n");

    console.log(ret);
    return ret;
}

module.exports = require("express")
    .Router()
    .post("/", multer.single("fisier"), processor);
