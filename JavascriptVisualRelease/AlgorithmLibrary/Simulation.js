
 
// Stores an argument given to insertElement
class SchedEntity {
	constructor(value, color) {
		this.value = value;
		this.color = color;
	}
}

// The current line of execution is halted, but the screen is still responsive
// to user input.
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// Adds a random node to the visualized tree.
anim_add_process = async function(name, vruntime, color) {
	// Sleep gives time for the event to register
	await sleep(100);

	let se = new SchedEntity(vruntime, color);

	currentAlg.implementAction(currentAlg.insertElement.bind(currentAlg), se);
}

// Removes the left-most node from the visualized tree.
anim_remove_left = async function() {
	// Sleep gives time for the event to register
	await sleep(100);

	currentAlg.implementAction(currentAlg.deleteLeftmostNode.bind(currentAlg));
}

/*
* Adds a new status message to the scrolling message board.
* Parameters:
* -----------
* msg: string message to display
* color: hex color of block to be displayed before message
*/
post_status = function(msg, color) {
	// Add new status message
	document.getElementById("ul_statuses").innerHTML +=
		`<li>
			${get_color_block(color)} ${msg}
		</li>`;
	// Scroll to bottom
	var status_div = document.getElementById("div_procs");
	status_div.scrollTop = status_div.scrollHeight;
}

get_color_block = function(color) {
    return `<span style="color:${color}">&#9608;&#9608;&#9608;</span>`
}

/*
* Sets the time value on the screen (need not only be a number).
*/
set_time = function(val) {
    document.getElementById("span_time").innerHTML = val;
}

// Simulation states
let ADDING_NEW_PROCESSES = 1;
let GETTING_NEXT_PROCESS = 2;
let RUNNING_PROCESS = 3
let REPLACING_CURRENT_PROCESS = 4;
let FINISHED = 5;

let SLEEP_TIME = 250; // ms

/*
* This is the core class which handles all of the logic for the simulation. 
*/
class CFSSimulation {
    constructor(target_latency, minimum_granularity) {
        this.time = 0;
        this.cfs = new CFS(target_latency, minimum_granularity);
        this.processes = [];
        this.state = ADDING_NEW_PROCESSES;
        this.curr_node = null;
        this.target_latency = target_latency;
        this.minimum_granularity = minimum_granularity;
        this.active = false;

        this.colors = new Queue()
        let temp = [
            "#FFDFD3",
            "#FFF9AA",
            "#BCF6FE",
            "#AFD5AA",
            "#FFC2EF",
            "#CAA7BD",
            "#CEB8FF",
            "#6CB2D1",
            "#FECBA5",
            "#B7C68B",
            "#DF9881",
            "#89FAA6"
        ]
        for (let i in temp) {
            this.colors.enqueue(temp[i]);
        }
    }

    /*
    * Add a process to the list of processes to execute.
    * Parameters:
    * -----------
    * name: an arbitrary string name for the process
    * start_time: the time when the processes "arrives"
    * time_needed: how many time units the process will need to be completed
    */
    add_process(name, start_time, time_needed) {
        let next_color = this.colors.dequeue();
        this.processes.push(new Process(name, time_needed, start_time, next_color))
    }

    /*
    * Starts the simulation.
    */
    start() {
        this.active = true;
        this.resume_simulation();
    }

    /*
    * This function should be continuously called from within the event
    * listener for "end animation". It will trigger an animation on every call
    * except the last, after which the event handler will not be called and
    * the function will cease to execute. 
    */
    async resume_simulation() {
        // This while loop exists because some of the paths that this function
        // takes do not result in an animation being called. The loop will 
        // iterate again, eventually taking a path that does trigger an
        // animation.
        while (this.state != FINISHED) {
            if (this.state == ADDING_NEW_PROCESSES) {
                set_time(this.time + ` (Inserting newly available processes)`);
                let done = true;

                for (let i in this.processes) {
                    let process = this.processes[i];
                    if (process.is_done) {
                        continue;
                    } else {
                        done = false;
                    }

                    if (this.time >= process.start_time && process.in_tree == false) {
                        this.cfs.add_process(process);
                        console.log(this.cfs.rb_tree.to_string());
                        process.in_tree = true;
                        post_status(`Process ${process.name} is being inserted into the tree with a vruntime of ${process.vruntime} (out of ${process.total_time_needed})`, process.color);
                        anim_add_process(process.name, process.vruntime, process.color);
                        return;
                    }
                }
                
                if (done) {
                    this.state = FINISHED;
                } else {
                    this.state = GETTING_NEXT_PROCESS;
                }
            } else if (this.state == GETTING_NEXT_PROCESS) {
                set_time(this.time + ` (Removing next scheduled process)`);
                // If there is nothing to do, add to time and look for new
                // processes that may have become available.
                if (this.cfs.rb_tree.empty()) {
                    this.state = ADDING_NEW_PROCESSES;
                    this.time += 1;
                    set_time(this.time + ` (no processes available)`);
                    await sleep(SLEEP_TIME);
                } else {
                    // Choose next process to run
                    this.curr_node = this.cfs.get_next();
                    console.log(this.cfs.rb_tree.to_string());
                    
                    // Animate the removing of the process about to run from
                    // the tree
                    anim_remove_left();
                    this.state = RUNNING_PROCESS;
                    return;
                } 
            } else if (this.state == RUNNING_PROCESS) {
                // Number of processes (plus one since we already remove
                // the one about to run)
                let N = this.cfs.get_number_processes() + 1;
                let mg = this.minimum_granularity;
                let fair_share = Math.floor((1/N)*this.target_latency);
                // How long this processes will run for
                let duration = Math.max(mg, fair_share);
                let remaining_time = this.curr_node.data.total_time_needed - this.curr_node.data.vruntime;
                duration = Math.min(duration, remaining_time);

                // "Run" the process
                this.curr_node.data.vruntime += duration;
                this.curr_node.key = this.curr_node.data.vruntime;

                let color = this.curr_node.data.color;
                post_status(`Process ${this.curr_node.data.name} has been scheduled to run for ${duration} time units`, color);

                for (let i = 0; i < duration; i++) {
                    this.time += 1;
                    set_time(this.time + ` (${get_color_block(color)} running)`);
                    await sleep(SLEEP_TIME);
                }
                // Remove "color running" message
                set_time(this.time);

                this.state = REPLACING_CURRENT_PROCESS;
            }
            else if (this.state == REPLACING_CURRENT_PROCESS) {
                this.state = ADDING_NEW_PROCESSES;
                if (this.curr_node.data.vruntime >= this.curr_node.data.total_time_needed) {
                    // The process is done
                    post_status(`Process ${this.curr_node.data.name} has completed at time ${this.time}. It ran for ${this.curr_node.data.total_time_needed} time units and waited for ${(this.time - this.curr_node.data.start_time) - this.curr_node.data.total_time_needed} time units`, this.curr_node.data.color);
                    this.curr_node.data.is_done = true;
                    this.curr_node.data.time_finished = this.time;
                } else {
                    // Put the process back in the tree
                    this.cfs.add_process(this.curr_node.data);
                    console.log(this.cfs.rb_tree.to_string());
                    post_status(`Process ${this.curr_node.data.name} is being inserted into the tree with a vruntime of ${this.curr_node.data.vruntime} (out of ${this.curr_node.data.total_time_needed})`, this.curr_node.data.color);
                    anim_add_process(this.curr_node.data.name, this.curr_node.data.vruntime, this.curr_node.data.color);
                    return;
                }
            } else {
                throw "Simulator has entered an unknown state.";
            }
        }
        set_time(this.time + " (Finished)");
        document.getElementById('div_summary').innerHTML = get_summary();
        document.getElementById('div_summary').setAttribute("style", "display: block");
        document.getElementById('div_start_over').setAttribute("style", "display: block");
    }
}

let TARGET_LATENCY = 20;
let MINIMUM_GRANULARITY = 4
let simulation = undefined;

/*
* Parses text to make a CFSSimulation object. If successful, this function
* will set the global simulation object to the newly created object and return
* true. If parsing is not successful, the global object will not be touched
* and false will be returned.
*/
parse_input = function(txt) {
    let lines = txt.split("\n")
    // Target latency
    let tl = -1;
    // Minimum granularity
    let mg = -1;
    // Try to get target frequency and minimum granularity
    try {
        let i = lines[0].search(":");
        tl = Number(lines[0].substring(i+1));
        i = lines[1].search(":");
        mg = Number(lines[1].substring(i+1));
        
        if (isNaN(tl) || tl <= 0) {
            throw "invalid target latency";
        } 
        if (isNaN(mg) || mg <= 0 || mg > tl) {
            throw "invalid minimum granularity";
        }
    } catch (e) {
        alert("Invalid input: " + e);
        return false;
    }

    // Check that there are any processes to parse
    if (lines.length < 3) {
        alert("Invalid input: no processes");
        return false;
    }

    let new_cfs = new CFSSimulation(tl, mg);

    // Parse each of the processes
    for (let i = 2; i < lines.length; i++) {
        try {
            let parts = lines[i].trim().split(" ");
            if (parts.length != 3) {
                throw "processes does not consist of 3 parts"
            }
            let name = parts[0];
            let start_time = Number(parts[1]);
            let total_time = Number(parts[2]);

            if (isNaN(start_time) || start_time < 0) {
                throw "invalid start time";
            } 
            if (isNaN(total_time) || total_time <= 0) {
                throw "invalid total time";
            }

            new_cfs.add_process(name, start_time, total_time);
        } catch (e) {
            alert("Invalid input: " + e);
            return false;
        }
    }

    simulation = new_cfs;
    return true;
}

/*
* Return the inner HTML for a table that displayed the stats of the simulation,
* which includes:
*   1) Finish time: the time unit when the process completed
*   2) Turnaround time: the number of time units between arrival and completion
*   3) Normalized turnaround time: turnaround time / service time
*/
get_summary = function (e) {
    let table = "";
    // Make sure the simulation exists and has already finished
    if (simulation != undefined && simulation.state == FINISHED) {
        // Header row
        table += '<table class="tg"><tr><th>Process</th>';
        for (let i = 0; i < simulation.processes.length; i++) {
            table += `<th class="tg-fymr">${simulation.processes[i].name}</th>`;
        }
        // Arrival time
        table += "</tr><tr><td>Arrival Time</td>";
        for (let i = 0; i < simulation.processes.length; i++) {
            table += `<td class="tg-0pky">${simulation.processes[i].start_time}</td>`;
        }
        // Serive Time (T_s)
        table += "</tr><tr><td>Service Time (T<sub>s</sub>)</td>";
        for (let i = 0; i < simulation.processes.length; i++) {
            table += `<td class="tg-0pky">${simulation.processes[i].total_time_needed}</td>`;
        }
        // Finish Time
        table += "</tr><tr><td>Finish Time</td>";
        for (let i = 0; i < simulation.processes.length; i++) {
            table += `<td class="tg-0pky">${simulation.processes[i].time_finished}</td>`;
        }
        // Turnaround Time (T_r)
        table += "</tr><tr><td>Turnaround Time (T<sub>r</sub>)</td>";
        for (let i = 0; i < simulation.processes.length; i++) {
            table += `<td class="tg-0pky">${simulation.processes[i].time_finished - simulation.processes[i].start_time}</td>`;
        }
        // Normalized Turnaround Time (T_r / T_s)
        table += "</tr><tr><td>T<sub>r</sub> / T<sub>s</sub></td>";
        for (let i = 0; i < simulation.processes.length; i++) {
            table += `<td class="tg-0pky">${((simulation.processes[i].time_finished - simulation.processes[i].start_time) / simulation.processes[i].total_time_needed).toFixed(2)}</td>`;
        }
        table += "</td></table>"
    }
    return table;
}

// Add event listener
document.addEventListener('ANIM_ENDED', function (e) {
    console.log("anim_ended");
    if (simulation != undefined && simulation.active) {
        simulation.resume_simulation();
    }
}, false)

document.getElementById('btn_start_sim').addEventListener('click', function (e) {
    console.log("clicked start animation... attempting to parse input");
    let txt = document.getElementById("ta_input").value;
    if (parse_input(txt)) {
        document.getElementById('div_input').setAttribute("style", "display: none");
        document.getElementById('div_statuses').setAttribute("style", "display: block");
        simulation.start();
    }
});

document.getElementById('btn_start_over').addEventListener('click', function (e) {
    document.getElementById('div_input').setAttribute("style", "display: block");
    document.getElementById('div_statuses').setAttribute("style", "display: none");
    document.getElementById('div_start_over').setAttribute("style", "display: none");
    document.getElementById('div_summary').setAttribute("style", "display: none");
});
