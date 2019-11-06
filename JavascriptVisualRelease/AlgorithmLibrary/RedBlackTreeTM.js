/*
* Author: Thomas McKanna
* CS3800 (Operating Systems) Fall 2019 Project
* Missouri University of Science and Technology
*/

const RED = 0;
const BLACK = 1;

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
    constructor(color, key, left, right, p) {
        this.color = color;
        this.key = key;
        this.left = left;
        this.right = right;
        this.p = p;
    }
}

class RedBlackTreeTM {
    constructor() {
        // Sentinel node acts as a "nil" leaf node and is parent of root
        this.nil = RbNodeTM(BLACK, -1, null, null, null);
        this.root = this.sentinel;
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

