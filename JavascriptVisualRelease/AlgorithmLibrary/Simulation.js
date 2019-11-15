
 
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
	var status_div = document.getElementById("div_statuses");
	status_div.scrollTop = status_div.scrollHeight;
}

get_color_block = function(color) {
    return `<span style="color:${color}">&#9608;&#9608;&#9608;</span>`
}

/*
* Sets the time value on the screen.
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

        this.colors = new Queue()
        let temp = [
            "#FFBFBF",
            "#CEB8FF",
            "#AED4DE",
            "#EBB5B5",
            "#E1E29A",
            "#BCF6FE",
            "#C3DCD7",
            "#FFC2EF",
            "#F0E2A1",
            "#DAB4A4",
            "#E0B1E0",
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
                    set_time(this.time);
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
                    await sleep(250);
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
    }
}

let TARGET_LATENCY = 20;
let MINIMUM_GRANULARITY = 4
let simulation = new CFSSimulation(TARGET_LATENCY, MINIMUM_GRANULARITY)

// Add processes to simulation...
simulation.add_process("P1", 0, 20);
simulation.add_process("P2", 0, 5);
simulation.add_process("P3", 0, 10);
simulation.add_process("P4", 15, 20);
simulation.add_process("P5", 20, 5);
simulation.add_process("P5", 250, 5);

// Add event listener
document.addEventListener('ANIM_ENDED', function (e) {
    console.log("anim_ended")
    simulation.resume_simulation();
}, false)
