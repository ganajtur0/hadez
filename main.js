function hades_compile(functions) {

    const hades = new HadesManager();
    hades.createComponent("Ipin", "D")
    hades.createComponent("Ipin", "C")
    hades.createComponent("Ipin", "B")
    hades.createComponent("Ipin", "A")
    hades.newLayer();
    hades.createComponent("Inv", "!D")
    hades.createComponent("Inv", "!C")
    hades.createComponent("Inv", "!B")
    hades.createComponent("Inv", "!A")

    let and_expressions = [];

    for (let [_,fun] of Object.entries(functions)) {
        if (fun === "0") {
            continue;
        }

        and_expressions.push(...fun.split("+"));
    }

    hades.newLayer();

    and_expressions.forEach((and_expr) => {
        hades.createComponent(`And${and_expr.split("*").length}`, and_expr);
    });

    hades.newLayer();

    for (let [_,fun] of Object.entries(functions)) {

        if (fun === "0") {
            continue;
        }

        const and_expressions = fun.split("+");

        if (and_expressions.length == 1) {
            continue;
        }

        if (and_expressions.length <= 4) {
            hades.createComponent(`Or${and_expressions.length}`, fun);
        }
        else {
            switch (and_expressions.length) {
                case 5:
                    hades.createComponent("Or3", and_expressions.slice(0,3).join('+'));
                    hades.newLayer();
                    hades.createComponent("Or2", and_expressions.slice(-2).join('+'));
                    break;
                case 6:
                    hades.createComponent("Or3", and_expressions.slice(0,3).join('+'));
                    hades.newLayer();
                    hades.createComponent("Or3", and_expressions.slice(-3).join('+'));
                    break;
            }
            hades.createComponent("Or2", fun);
        }

    }
    return hades;
}

function qm_optimize(minterms) {
    let functions = {};
    for (let i = 0; i<7; i++) {
        minterm = minterms[String.fromCharCode(i + 97)];
        const g = new QuineMcCluskey("DCBA", minterm.ones, minterm.dont_cares);
        functions[String.fromCharCode(i + 97)] = g.getFunction();
    }
    // console.log(functions);
    return functions;
}

function extract_minterms() {

    let minterms = {
        a : {
            ones : [],
            dont_cares : [],
        },
        b : {
            ones : [],
            dont_cares : [],
        },
        c : {
            ones : [],
            dont_cares : [],
        },
        d : {
            ones : [],
            dont_cares : [],
        },
        e : {
            ones : [],
            dont_cares : [],
        },
        f : {
            ones : [],
            dont_cares : [],
        },
        g : {
            ones : [],
            dont_cares : [],
        }
    };

    for (let row = 0; row<16; row++) {
        const tr = document.getElementById(`tr${row}`);
        for (const [i, td] of Array.from(tr.children).slice(5).entries()) {
            if (td.children[0].value == "1") {
                minterms[String.fromCharCode(i + 97)].ones.push(row);
            }
            else if (td.children[0].value == "-") {
                minterms[String.fromCharCode(i + 97)].dont_cares.push(row);
            }
        }
    }
    // console.log(minterms);
    return minterms;
}

function generateKVTable(variable, data, func) {
    const size = 4;
    let table = document.createElement("table");
    table.classList.add("kv-table");

    let caption = document.createElement("caption");
    caption.textContent = `${variable} = ${func}`;
    table.appendChild(caption);

    for (const row of [
        [0, 8, 12, 4],
        [2, 10, 14, 6],
        [3, 11, 15, 7],
        [1, 9, 13, 5]]) {
        let tr = document.createElement("tr");
        for (const index of row) {
            let cell = document.createElement("td");
            if (data.ones.includes(index)) {
                cell.textContent = "1";
                cell.classList.add("one");
            } else if (data.dont_cares.includes(index)) {
                cell.textContent = "-";
                cell.classList.add("dont-care");
            } else {
                cell.textContent = "0";
            }
            tr.appendChild(cell);
        }
        table.appendChild(tr);
    }

    return table;
}

function renderKVTables(minterms, functions) {
    const container = document.getElementById("kv-tables");
    container.innerHTML = "";
    for (const variable in minterms) {
        const table = generateKVTable(variable, minterms[variable], functions[variable]);
        container.appendChild(table);
    }
}

function createHadesFile(hades) {
    document.getElementById("letolt_gomb").disabled = false;

    let element = document.createElement('a');
    element.setAttribute('id', 'hades_file');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(hades.toString()));
    element.setAttribute('download', 'generalt.hds');

    element.style.display = 'none';
    document.body.appendChild(element);
}

function download() {
    let hades_file_link = document.getElementById("hades_file");
    if (hades_file_link === null) {
        return;
    }
    hades_file_link.click();
    document.body.removeChild(hades_file_link);
}

function solve() {
    let minterms = extract_minterms();
    let functions = qm_optimize(minterms);
    renderKVTables(minterms, functions);
    let hades = hades_compile(functions);
    createHadesFile(hades);
}
