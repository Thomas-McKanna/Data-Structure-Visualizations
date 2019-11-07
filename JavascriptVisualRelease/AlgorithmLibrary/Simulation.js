
 
// Stores an argument given to insertElement
class SchedEntity {
	constructor(value, color) {
		this.value = value;
		this.color = color;
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// Adds a random node to the tree
anim_add_process = async function(name, vruntime, color) {
	// Sleep gives time for the event to register
	await sleep(100);

	let se = new SchedEntity(vruntime, color);

	currentAlg.implementAction(currentAlg.insertElement.bind(currentAlg), se);
}

// Removes the left-most node from the tree
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
			<span style="color:${color}">&#9608;&#9608;&#9608;</span> ${msg}
		</li>`;
	// Scroll to bottom
	var status_div = document.getElementById("div_statuses");
	status_div.scrollTop = status_div.scrollHeight;
}

// Simulation states
let ADDING_NEW_PROCESSES = 1;
let GETTING_NEXT_PROCESS = 2;
let REPLACING_CURRENT_PROCESS = 3;
let FINISHED = 4;

class CFSSimulation {
    constructor() {
        this.time = 0;
        this.cfs = new CFS();
        this.processes = [];
        this.state = ADDING_NEW_PROCESSES;
        this.curr_node = null;

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

    add_process(name, start_time, time_needed) {
        let next_color = this.colors.dequeue();
        this.processes.push(new Process(name, time_needed, start_time, next_color))
    }

    /*
    * This function should be continuously called until it returns true, at
    * which point the simulation has completed. This function relies heavily
    * on current state, and for each state it will behave differently.
    */
    resume_simulation() {
        while (this.state != FINISHED) {
            if (this.state == ADDING_NEW_PROCESSES) {
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

                this.state = GETTING_NEXT_PROCESS;
                if (done) {
                    this.state = FINISHED
                } 
            } else if (this.state == GETTING_NEXT_PROCESS) {
                if (this.cfs.rb_tree.empty()) {
                    this.state = ADDING_NEW_PROCESSES;
                    this.time += 1;
                } else {
                    this.curr_node = this.cfs.get_next();
                    console.log(this.cfs.rb_tree.to_string());
                    // Grab and run the process
                    // console.log(this.curr_node)
                    this.curr_node.data.vruntime += 1;
                    this.curr_node.key = this.curr_node.data.vruntime;
                    
                    post_status(`Process ${this.curr_node.data.name} has been selected to run next`, this.curr_node.data.color);
                    this.state = REPLACING_CURRENT_PROCESS;
                    this.time += 1;
                    anim_remove_left();
                    return;
                } 
            } else if (this.state == REPLACING_CURRENT_PROCESS) {
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
    }
}

let simulation = new CFSSimulation()

// Add processes to simulation...
simulation.add_process("P1", 0, 10);
simulation.add_process("P2", 0, 12);
simulation.add_process("P3", 2, 4);
simulation.add_process("P4", 5, 9);
simulation.add_process("P5", 6, 2);
simulation.add_process("P5", 6, 10);

// Add event listener
document.addEventListener('ANIM_ENDED', function (e) {
    console.log("anim_ended")
    simulation.resume_simulation();
}, false)
