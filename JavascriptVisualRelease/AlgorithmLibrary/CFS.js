class Process {
    /*
    * Parameters:
    * -----------
    * name: string name of process
    * total_runtime: how many time units this process will execute before
    * finishing (this value is not used the the CFS, but is used by the
    * simulator to determine when a process is "done")
    * color: a hex color string in the form "#FFFFFF" (used for visualization)
    */
    constructor(name, total_runtime, color) {
        this.name = name;
        this.total_runtime = total_runtime;
        this.vruntime = 0;
        this.color = color
    }
}

class CFS {
    constructor() {
        this.rb_tree = new RedBlackTreeTM();
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
}