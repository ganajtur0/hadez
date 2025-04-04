import os


class Hades:
    def __init__(self, project):
        self.project_name = os.path.splitext(os.path.basename(project))[0]
        self.gap = 1200
        self.prev = ""
        self.layer_y = 0
        self.x = 0
        self.project = project
        self.txt_file = self.project_name + ".txt"
        self.width_map = {
            "And": 3600,
            "Or": 3600,
            "JK": 3600,
            "Inv": 1800,
            "Ipin": 1200,
        }
        self.height_map = {
            "And": 2400,
            "Or": 2400,
            "JK": 4800,
            "Inv": 1200,
            "Ipin": 1200,
            "PulseSwitch": 1200,
        }
        self.latency_map = {
            "Ipin": "0",
            "And": "1.0E-8",
            "Or": "1.0E-8",
            "Inv": "5.0E-9",
            "PulseSwitch": "0.1",
            "JK": "5.0E-9",
        }
        self.name_map = {
            "Ipin": "hades.models.io.Ipin",
            "PulseSwitch": "hades.models.io.PulseSwitch",
            "And": "hades.models.gates.And",
            "Or": "hades.models.gates.Or",
            "Inv": "hades.models.gates.InvSmall",
            "JK": "hades.models.flipflops.Jkff",
        }
        self.components = []

    def createComponent(self, typ, name, new_layer=False):
        n = ""
        if typ[-1] in "0123456789":
            n = typ[-1]
            typ = typ[:-1]
        if new_layer:
            self.layer_y = 0
            self.x += self.gap + self.width_map[self.prev]
        self.components.append(
            f"{self.name_map[typ]}{n} {name} {self.x} {self.layer_y} @N 1001 {self.latency_map[typ]}"
        )
        self.layer_y += self.height_map[typ]
        self.prev = typ

    def dump_minterms(self, minterms):
        with open(self.txt_file, "w") as f:
            if type(minterms) is list:
                f.write("\n".join(minterms))
                return
            f.write(minterms)

    def dump(self):
        with open(self.project, "w") as f:
            f.write(
                f"# hades.models.Design file\n#\n[name] {self.project_name}\n[components]\n"
            )
            f.write("\n".join(self.components) + "\n")
            f.write("[end components]\n[signals]\n[end signals]\n[end]")


class Tabla:
    def __init__(self, fname=None, text=None):
        if text is None:
            self.fname = fname
            self._tabla_beolvas()
        else:
            self.tabla = text
        self._tabla_parse()

    def _tabla_beolvas(self):
        with open(self.fname, "r") as f:
            self.tabla = [x.strip("\n").split("\t") for x in f.readlines()]

    def _tabla_parse(self):
        for i, y in enumerate(self.tabla[0]):
            if y not in "ABCD ":
                _valtozo_index = i
                break
        self.valtozok = list(filter(lambda x: x not in "ABCD ", self.tabla[0]))
        self.igazsagok = []
        for i in range(len(self.valtozok)):
            self.igazsagok.append([x[_valtozo_index] for x in self.tabla[1:]])
            _valtozo_index += 1
        self.termek = list(
            map(
                lambda i: [
                    y[0] for y in list(filter(lambda x: (x[1] == "1"), enumerate(i)))
                ],
                self.igazsagok,
            )
        )
        self.dck = list(
            map(
                lambda i: [
                    y[0]
                    for y in list(filter(lambda x: (x[1].lower() == "x"), enumerate(i)))
                ],
                self.igazsagok,
            )
        )

    def KVdump(self, v):
        try:
            i = self.valtozok.index(v)
        except ValueError:
            print(f"{v} változó nincs a táblában")
            return
        t = self.igazsagok[i]
        with open(f"{v}.txt", "w") as f:
            f.write(
                "\t".join([t[0], t[8], t[12], t[4]])
                + "\n"
                + "\t".join([t[2], t[10], t[14], t[6]])
                + "\n"
                + "\t".join([t[3], t[11], t[15], t[7]])
                + "\n"
                + "\t".join([t[1], t[9], t[13], t[5]])
            )


import sys
import qm


if __name__ == "__main__":
    ZH = 1
    if len(sys.argv) < 3:
        tablafajl = input("Igazságtábla elérési útja: ")
        hadesfajl = input("Hades fájl helye (ha nem létezik, a program létrehozza): ")
        zh = input("Hányadik ZH-t készíted? ")
        if int(zh) != 1:
            ZH = 2
    else:
        tablafajl = sys.argv[1]
        hadesfajl = sys.argv[2]
        if len(sys.argv) == 4:
            ZH = 2

    if not os.path.isfile(tablafajl):
        print(f"{tablafajl} nem létezik vagy nem egy fájl!")
        exit()
    if not os.path.isfile(tablafajl):
        print(f"{tablafajl} nem létezik vagy nem egy fájl!")
        exit()
    tabla = Tabla(fname=tablafajl)
    hades = Hades(hadesfajl)
    qm_solver = qm.QM(list("DCBA"))

    functions = [
        qm_solver.get_as_list(qm_solver.solve(ones=tabla.termek[i], dc=tabla.dck[i])[1])
        for i in range(len(tabla.termek))
    ]

    AND = []
    OR = []

    for _or in functions:
        if _or not in OR:
            OR.append(_or)

    for _or in functions:
        for _and in _or:
            if _and not in AND:
                AND.append(_and)

    minterms = [
        f"{tabla.valtozok[i]}: " + " + ".join(["*".join(x) for x in y])
        for i, y in enumerate(functions)
    ]
    bruh_momentos = "\n"
    print(f"Mintermek:\n{bruh_momentos.join(minterms)}")
    hades.dump_minterms(minterms)

    if ZH == 1:
        hades.createComponent("Ipin", "D")
        hades.createComponent("Ipin", "C")
        hades.createComponent("Ipin", "B")
        hades.createComponent("Ipin", "A")
        hades.createComponent("Inv", "!D", True)
        hades.createComponent("Inv", "!C")
        hades.createComponent("Inv", "!B")
        hades.createComponent("Inv", "!A")
    else:
        hades.createComponent("PulseSwitch", "CLK")
        hades.createComponent("PulseSwitch", "RST")
        hades.createComponent("Inv", "!RST")
        hades.createComponent("JK", "TA", True)
        hades.createComponent("JK", "TB", True)
        hades.createComponent("JK", "TC", True)
        hades.createComponent("JK", "TD", True)

    hades.createComponent(f"And{len(AND[0])}", "*".join(AND[0]), True)
    for m in AND[1:]:
        hades.createComponent(f"And{len(m)}", "*".join(m))

    buffer = []

    if len(OR[0]) <= 4:
        hades.createComponent(
            f"Or{len(OR[0])}", "+".join("*".join(x) for x in OR[0]), True
        )

    else:
        match len(OR[0]):
            case 5:
                hades.createComponent(
                    "Or3", "+".join("*".join(x) for x in OR[0][:3]), True
                )
                hades.createComponent("Or2", "+".join("*".join(x) for x in OR[0][3:]))
                buffer.append(("Or2", "+".join("*".join(x) for x in OR[0])))
            case 6:
                hades.createComponent(
                    "Or3", "+".join("*".join(x) for x in OR[0][:3]), True
                )
                hades.createComponent("Or3", "+".join("*".join(x) for x in OR[0][3:]))
                buffer.append(("Or2", "+".join("*".join(x) for x in OR[0])))
            case 7:
                hades.createComponent(
                    "Or3", "+".join("*".join(x) for x in OR[0][:3]), True
                )
                hades.createComponent("Or4", "+".join("*".join(x) for x in OR[0][3:]))
                buffer.append(("Or2", "+".join("*".join(x) for x in OR[0])))
            case other:
                pass

    for _or in OR[1:]:
        if len(_or) <= 4:
            hades.createComponent(f"Or{len(_or)}", "+".join("*".join(x) for x in _or))

        else:
            match len(_or):
                case 5:
                    hades.createComponent("Or3", "+".join("*".join(x) for x in _or[:3]))
                    hades.createComponent("Or2", "+".join("*".join(x) for x in _or[3:]))
                    buffer.append(("Or2", "+".join("*".join(x) for x in _or)))
                case 6:
                    hades.createComponent("Or3", "+".join("*".join(x) for x in _or[:3]))
                    hades.createComponent("Or3", "+".join("*".join(x) for x in _or[3:]))
                    buffer.append(("Or2", "+".join("*".join(x) for x in _or)))
                case 7:
                    hades.createComponent(
                        "Or3", "+".join("*".join(x) for x in OR[0][:3]), True
                    )
                    hades.createComponent("Or4", "+".join("*".join(x) for x in OR[0][3:]))
                    buffer.append(("Or2", "+".join("*".join(x) for x in OR[0])))
                case other:
                    pass

    if len(buffer) > 0:
        hades.createComponent(buffer[0][0], buffer[0][1], True)
        for tup in buffer:
            hades.createComponent(tup[0], tup[1])

    hades.dump()

    for valtozo in tabla.valtozok:
        tabla.KVdump(valtozo)

    print("\nHades fájl sikeresen létrehozva!")

    if os.name != "posix":
        tupni = input()
