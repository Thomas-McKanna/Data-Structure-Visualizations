/*
* Author: Thomas McKanna
* CS3800 (Operating Systems) Fall 2019 Project
* Missouri University of Science and Technology
*/

const RED = 0;
const BLACK = 1;
var buffer = "";

/*
* Represents a node in a Red-Black Tree.
*
* Data members:
* -------------
* color: either RED or BLACK
* key: the value being used to index (sort) the node
* left: the left child, either an RbNodeTM or sentinel (null node)
* right: the right child, either an RbNodeTM or sentinel (null node)
* p: the parent node, either RbNodeTM or sentinel (root's parent)
*/
class RbNodeTM {
    constructor(key, color) {
        // Color is an optional parameter
        if (color === undefined || (color != RED && color != BLACK)) {
            this.color = RED;
        } else {
            this.color = color;
        }

        this.key = key;
        this.left = null;
        this.right = null;
        this.p = null;
    }

    to_string() {
        buffer = "";
        this.print("", "");
        return buffer;
    }

    print(prefix, children_prefix) {
        buffer += prefix;
        buffer += this.key;
        buffer += "\n";

        // Left child
        if (this.left.key != null) {
            this.left.print(children_prefix + "|--  ", children_prefix + "|   ");
        }

        // Right child
        if (this.right.key != null) {
            this.right.print(children_prefix + "+-- ", children_prefix + "    ");
        }
    }
}

class RedBlackTreeTM {
    constructor() {
        // Sentinel node acts as a "nil" leaf node and is parent of root
        this.nil = new RbNodeTM(null, BLACK);
        this.root = this.nil;
    }

    to_string() {
        return this.root.to_string();
    }
}

/*
* Pivots a node to the right:
*       |           |
*       y           x
*      / \   ==>   / \
*     x   l       a   y
*    / \             / \
*   a   b           b   l
*/
function right_rotate(T, y) {
    if (y.left == T.nil) {
        throw "Error in right_rotate: left child is nil";
    }
    // Set x
    let x = y.left;
    // Turn x's right subtree into y's left subtree
    y.left = x.right;
    if (x.right != T.nil) {
        x.right.p = y;
    }
    // Link y's parent to x
    x.p = y.p;
    if (y.p == T.nil) {
        T.root = x;
    } else if (y == y.p.left) {
        y.p.left = x;
    } else {
        y.p.right = x;
    }
    // Put y on x's right
    x.right = y;
    y.p = x;
}

/*
* Pivots a node to the left:
*       |           |
*       y           x
*      / \   <==   / \
*     x   l       a   y
*    / \             / \
*   a   b           b   l
*/
function left_rotate(T, x) {
    if (x.right == T.nil) {
        throw "Error in left_rotate: right child is nil";
    }
    // Set y
    let y = x.right;
    // Turn y's left subtree into x's right subtree
    x.right = y.left;
    if (y.left != T.nil) {
        y.left.p = x;
    }
    // Link x's parent to y
    y.p = x.p;
    if (x.p == T.nil) {
        T.root = y;
    } else if (x == x.p.left) {
        x.p.left = y;
    } else {
        x.p.right = y;
    }
    // Put x on y's left
    y.left = x;
    x.p = y;
}

/*
* Inserts z into RB-Tree T.
*/
function rb_insert(T, z) {

    let y = T.nil;
    let x = T.root;
    while (x != T.nil) {

        y = x;
        if (z.key < x.key) {
            x = x.left;
        } else {
            x = x.right;
        }
    }
    z.p = y;
    if (y == T.nil) {
        T.root = z;
    } else if (z.key < y.key) {
        y.left = z;
    } else {
        y.right = z;
    }
    z.left = T.nil;
    z.right = T.nil;
    z.color = RED;
    rb_insert_fixup(T, z);
}

/*
* Because rb_insert may have violated the properties of the RB-Tree, this
* function will restore the broken properties.
*/
function rb_insert_fixup(T, z) {
    while (z.p.color == RED) {
        if (z.p == z.p.p.left) {
            let y = z.p.p.right;
            if (y.color == RED) {
                z.p.color = BLACK;
                y.color = BLACK;
                z.p.p.color = RED;
                z = z.p.p;
            } else {
                if (z == z.p.right) {
                    z = z.p;
                    left_rotate(T, z);
                }
                z.p.color = BLACK;
                z.p.p.color = RED;
                right_rotate(T, z.p.p);
            }
        }
        // Same as the previous clause, but with "right" and "left" exchanged
        else {
            let y = z.p.p.left;
            if (y.color == RED) {
                z.p.color = BLACK;
                y.color = BLACK;
                z.p.p.color = RED;
                z = z.p.p;
            } else {
                if (z == z.p.left) {
                    z = z.p;
                    right_rotate(T, z);
                }
                z.p.color = BLACK;
                z.p.p.color = RED;
                left_rotate(T, z.p.p);
            }
        }
    }
    T.root.color = BLACK;
}



