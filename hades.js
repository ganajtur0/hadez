class HadesManager {
    constructor() {
        this.gap = 1200;
        this.prev = "";
        this.x = 0;
        // stores the y values of the layers
        this.layers = [0,0,0,0,0];
        this.current_layer = 0;
        
        this.widthMap = {
            "And": 3600,
            "Or": 3600,
            "JK": 3600,
            "Inv": 1800,
            "Ipin": 1200,
        };

        this.heightMap = {
            "And": 2400,
            "Or": 2400,
            "JK": 4800,
            "Inv": 1200,
            "Ipin": 1200,
            "PulseSwitch": 1200,
        };

        this.latencyMap = {
            "Ipin": "0",
            "And": "1.0E-8",
            "Or": "1.0E-8",
            "Inv": "5.0E-9",
            "PulseSwitch": "0.1",
            "JK": "5.0E-9",
        };

        this.nameMap = {
            "Ipin": "hades.models.io.Ipin",
            "PulseSwitch": "hades.models.io.PulseSwitch",
            "And": "hades.models.gates.And",
            "Or": "hades.models.gates.Or",
            "Inv": "hades.models.gates.InvSmall",
            "JK": "hades.models.flipflops.Jkff",
        };
        
        this.components = [];
    }

    nextLayer() {
        if (this.layers.length-1 == this.current_layer) {
            this.layers.push(0);
        }
        this.current_layer++;
        this.x += this.gap + this.widthMap[this.prev];
    }

    prevLayer() {
        if (this.current_layer == 0) return;
        this.current_layer--;
        this.x -= this.gap + this.widthMap[this.prev];
    }

    createComponent(t, name) {
        let n = "";
        let t_last = t.slice(-1);
        let type;
        if (t_last >= '0' && t_last <= '9') {
            n = t_last;
            type = t.slice(0, -1);
        }
        else {
            type = t;
        }
        this.components.push(
            `${this.nameMap[type]}${n} ${name} ${this.x} ${this.layers[this.current_layer]} @N 1001 ${this.latencyMap[type]}`
        );
        this.layers[this.current_layer] += this.heightMap[type];
        this.prev = type;
    }

    toString() {
        let text = "# hades.models.Design file\n#\n[name] zh1\n[components]\n";
        text += this.components.join("\n");
        text += "\n[end components]\n[signals]\n[end signals]\n[end]";
        return text;
    }

}


