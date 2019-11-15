class Process {
    /*
    * Parameters:
    * -----------
    * name: string name of process
    * total_time_needed: how many time units this process will execute before
    * finishing (this value is not used the the CFS, but is used by the
    * simulator to determine when a process is "done")
    * start_time: at what time unit that this process will start
    * color: a hex color string in the form "#FFFFFF" (used for visualization)
    */
    constructor(name, total_time_needed, start_time, color) {
        this.name = name;
        this.total_time_needed = total_time_needed;
        this.start_time = start_time;
        this.time_finished = -1;
        this.vruntime = 0;
        this.color = color
        this.is_done = false;
        this.in_tree = false;
    }
}

/*
* A "Completely Fair Scheduler" (CFS) simulator class. CFS is used by the Linux
* kernel to schedule non-real-time processes. It has been used since Linux
* version 2.6.23 (~2007). The goal of CFS is to model an "ideal, precise 
* multitasking CPU on real hardware". Here are some parameters that can
* be used to tweak the system:
*
*   -> Target Latency (TL): the minimum time required for every runnable task
*      to get at least one turn on the processor. Ideally this value is
*      infinitely small, but in the real world it is usually around 20ms. For
*      any given TL, the goal is to give each of N processes 1/N of the time.
*      For this simulation, each 'tick' of time will be modeled as one
*      millisecond.
*
*   -> Virtual Runtime (vruntime): the amount of "time" that this process has
*      spent running on the processor. Once a process uses up its alloted time
*      and is preempted, the time it spent on the processor will be added to 
*      its vruntime. The process with the lowest vruntime is always selected
*      next.
*
*   -> Nice Value: these values can be associated with a process and give that
*      task a higher or lower proportion of the 1/N slice of the TL. This value
*      currently is not incorporated into the simulation.
*
*   -> Minimum Granularity (MG): to account for context switch overhead, there
*      is a minimum amount of time that any scheduled process must run before
*      being preempted. In the real world, this value is usually around 4ms.
*/
class CFS {
    constructor(target_latency, minumum_granularity) {
        this.rb_tree = new RedBlackTreeTM();
        this.target_latency = target_latency;
        this.minumum_granularity = minumum_granularity;
    }

    /*
    * Adds a process to the CFS to start scheduling.
    * Parameters:
    * -----------
    * process: a Process object
    */
    add_process(process) {
        let new_node = new RbNodeTM(process.vruntime);
        new_node.data = process;
        rb_insert(this.rb_tree, new_node);
    }

    /*
    * Returns the next process which should be put on the processor. The
    * returned value is an RbNodeTM, which has the Process object stored 
    * inside the 'data' member.
    */
    get_next() {
        return pop_leftmost_node(this.rb_tree);
    }

    get_number_processes() {
        return this.rb_tree.get_size();
    }
}