const variables = ["_D", "_C", "_B", "_A"];

function hades_compile(functions) {

    const hades = new HadesManager();
    hades.createComponent("Ipin", "D")
    hades.createComponent("Ipin", "C")
    hades.createComponent("Ipin", "B")
    hades.createComponent("Ipin", "A")
    hades.nextLayer();
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

    hades.nextLayer();

    and_expressions.forEach((and_expr) => {
        hades.createComponent(`And${and_expr.split("*").length}`, and_expr);
    });

    hades.nextLayer();

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
                    hades.createComponent("Or2", and_expressions.slice(-2).join('+'));
                    break;
                case 6:
                    hades.createComponent("Or3", and_expressions.slice(0,3).join('+'));
                    hades.createComponent("Or3", and_expressions.slice(-3).join('+'));
                    break;
                case 7:
                    hades.createComponent("Or4", and_expressions.slice(0,4).join('+'));
                    hades.createComponent("Or3", and_expressions.slice(-3).join('+'));
                    break;
                case 8:
                    hades.createComponent("Or4", and_expressions.slice(0,4).join('+'));
                    hades.createComponent("Or4", and_expressions.slice(-4).join('+'));
                    break;
                case 9:
                    hades.createComponent("Or2", "HIBA!!!");
                    break;
            }
            hades.nextLayer();
            hades.createComponent("Or2", fun);
            hades.prevLayer();
        }

    }
    return hades;
}

function qm_optimize(minterms) {
    let functions = {};
    for (let i = 0; i<4; i++) {
        minterm = minterms[variables[i]];
        functions[variables[i]] = quine_mccluskey("DCBA", minterm.ones, minterm.dont_cares);
    }
    // console.log(functions);
    return functions;
}

function extract_minterms() {

    let minterms = {
        _A : {
            ones : [],
            dont_cares : [],
        },
        _B : {
            ones : [],
            dont_cares : [],
        },
        _C : {
            ones : [],
            dont_cares : [],
        },
        _D : {
            ones : [],
            dont_cares : [],
        },
    };

    for (let row = 0; row<16; row++) {
        const tr = document.getElementById(`tr${row}`);
        for (const [i, td] of Array.from(tr.children).slice(5).entries()) {
            if (td.children[0].value == "1") {
                minterms[variables[i]].ones.push(row);
            }
            else if (td.children[0].value == "-") {
                minterms[variables[i]].dont_cares.push(row);
            }
        }
    }
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
        const table = generateKVTable(variable.replace("_", "'"), minterms[variable], functions[variable]);
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
    console.log(hades.toString());
    createHadesFile(hades);
}

// Stolen from: https://gist.github.com/ysangkok/5707171

// from http://stackoverflow.com/a/11454049/309483

var combine = function (m, n) {
    var a = m.length, c = '', count = 0, i;
    for (i = 0; i < a; i++) {
        if (m[i] === n[i]) {
            c += m[i];
        } else if (m[i] !== n[i]) {
            c += '-';
            count += 1;
        }
    }

    if (count > 1) {
        return "";
    }

    return c;
};

var repeatelem = function(elem, count) {
    var accu = [],
        addOneAndRecurse = function(remaining) { accu.push(elem); if (remaining > 1) { addOneAndRecurse(remaining - 1); } };
    addOneAndRecurse(count);
    return accu;
};

var find_prime_implicants = function(data) {
    var newList = [].concat(data),
        size = newList.length,
        IM = [],
        im = [],
        im2 = [],
        mark = repeatelem(0, size),
        mark2,
        m = 0,
        i,
        j,
        c,
        p,
        n,
        r,
        q;
    for (i = 0; i < size; i++) {
        for (j = i + 1; j < size; j++) {
            c = combine(newList[i], newList[j]);
            if (c !== "") {
                im.push(c);
                mark[i] = 1;
                mark[j] = 1;
            }
        }
    }

    mark2 = repeatelem(0, im.length);
    for (p = 0; p < im.length; p++) {
        for (n = p + 1; n < im.length; n++) {
            if (p !== n && mark2[n] === 0 && im[p] === im[n]) {
                mark2[n] = 1;
            }
        }
    }

    for (r = 0; r < im.length; r++) {
        if (mark2[r] === 0) {
            im2.push(im[r]);
        }
    }

    for (q = 0; q < size; q++) {
        if (mark[q] === 0) {
            IM.push(newList[q]);
            m = m + 1;
        }
    }

    if (m !== size && size !== 1) {
        IM = IM.concat(find_prime_implicants(im2));
    }

    IM.sort();
    return IM;
}

const quine_mccluskey = (variables, minterms_decimal) => {
    const minterms = minterms_decimal.map(m => (m >>> 0).toString(2).padStart(4, '0'));
    prime_implicants = find_prime_implicants(minterms);
    return prime_implicants.map((pi) => {
        and_expr = [];
        pi.split("").forEach((x, i) => {
            switch (x) {
                case '0':
                    and_expr.push(`!${variables[i]}`);
                    break;
                case '1':
                    and_expr.push(variables[i]);
                    break;
                case '-':
                    break;
            }
        });
        return and_expr.join('*');
    }).join('+');
}
