"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.parseFiles = exports.getSrcSpan = exports.getLineNumber = exports.forNode = exports.flatMap = exports.getSingleton = exports.flattenBlock = exports.StmtParser = exports.parseGMark = exports.undefinedValue = exports.parseExpr = exports.anyType = exports.mustExist = exports.GModule = void 0;
var ts = require("typescript");
var typescript_1 = require("typescript");
var GModule = /** @class */ (function () {
    function GModule(name, stmts) {
        this.name = name;
        this.stmts = stmts;
    }
    return GModule;
}());
exports.GModule = GModule;
function mustExist(v, msg) {
    if (!v) {
        if (msg) {
            throw new Error("Must exists! Message: " + msg);
        }
        else {
            throw new Error("Must exists!");
        }
    }
    return v;
}
exports.mustExist = mustExist;
var UserAnnot = /** @class */ (function () {
    function UserAnnot(ty) {
        this.ty = ty;
        this.category = "UserAnnot";
    }
    return UserAnnot;
}());
var Inferred = /** @class */ (function () {
    function Inferred(ty) {
        this.ty = ty;
        this.category = "Inferred";
    }
    return Inferred;
}());
var TVar = /** @class */ (function () {
    function TVar(name) {
        this.name = name;
        this.category = "TVar";
        mustExist(name);
    }
    return TVar;
}());
var AnyType = /** @class */ (function () {
    function AnyType() {
        this.category = "AnyType";
        this.name = "any";
    }
    AnyType.instance = new AnyType();
    return AnyType;
}());
var FuncType = /** @class */ (function () {
    function FuncType(args, to) {
        this.args = args;
        this.to = to;
        this.category = "FuncType";
    }
    return FuncType;
}());
var ObjectType = /** @class */ (function () {
    function ObjectType(fields) {
        this.fields = fields;
        this.category = "ObjectType";
    }
    return ObjectType;
}());
exports.anyType = AnyType.instance;
var basicTypes = new Map();
basicTypes.set(typescript_1.SyntaxKind.BooleanKeyword, "boolean");
basicTypes.set(typescript_1.SyntaxKind.TrueKeyword, "boolean");
basicTypes.set(typescript_1.SyntaxKind.FalseKeyword, "boolean");
basicTypes.set(typescript_1.SyntaxKind.NumberKeyword, "number");
basicTypes.set(typescript_1.SyntaxKind.StringKeyword, "string");
basicTypes.set(typescript_1.SyntaxKind.SymbolKeyword, "Symbol");
basicTypes.set(typescript_1.SyntaxKind.EnumKeyword, "Enum");
basicTypes.set(typescript_1.SyntaxKind.VoidKeyword, "void");
basicTypes.set(typescript_1.SyntaxKind.ObjectKeyword, "object");
basicTypes.set(typescript_1.SyntaxKind.BigIntKeyword, "BigInt");
var ignoredTypes = new Set();
ignoredTypes.add(typescript_1.SyntaxKind.MappedType);
ignoredTypes.add(typescript_1.SyntaxKind.ConditionalType);
ignoredTypes.add(typescript_1.SyntaxKind.ThisType);
ignoredTypes.add(typescript_1.SyntaxKind.UnknownKeyword);
ignoredTypes.add(typescript_1.SyntaxKind.IndexedAccessType);
ignoredTypes.add(typescript_1.SyntaxKind.UndefinedKeyword);
ignoredTypes.add(typescript_1.SyntaxKind.NeverKeyword);
ignoredTypes.add(typescript_1.SyntaxKind.TypeOperator);
ignoredTypes.add(typescript_1.SyntaxKind.NullKeyword);
function parseTVars(n) {
    return n.typeParameters ? n.typeParameters.map(function (p) { return p.name.text; }) : [];
}
/** Replace all occurrences of type variables with any  */
function eliminateTypeVars(ty, tVars) {
    switch (ty.category) {
        case "TVar":
            if (tVars.includes(ty.name)) {
                return exports.anyType;
            }
            else {
                return ty;
            }
        case "FuncType": {
            var newFrom = ty.args.map(function (t) { return eliminateTypeVars(t, tVars); });
            var newTo = eliminateTypeVars(ty.to, tVars);
            return new FuncType(newFrom, newTo);
        }
        case "ObjectType": {
            var nf = ty.fields.map(function (nv) { return new NamedValue(nv.name, eliminateTypeVars(nv.value, tVars)); });
            return new ObjectType(nf);
        }
        case "AnyType":
            return ty;
        default:
            throw new Error("Unknown category: " + JSON.stringify(ty));
    }
}
function parseSignatureType(sig) {
    var tVars = parseTVars(sig);
    var argTypes = sig.parameters.map(function (p) {
        return p.type ? eliminateTypeVars(parseTypeNode(mustExist(p.type)), tVars) : exports.anyType;
    });
    var retType = sig.type ? eliminateTypeVars(parseTypeNode(sig.type), tVars) : new TVar("void");
    return new FuncType(argTypes, retType);
}
function parseDeclarationName(n) {
    switch (n.kind) {
        case typescript_1.SyntaxKind.Identifier:
            return n.text;
        case typescript_1.SyntaxKind.StringLiteral:
            return n.text;
        case typescript_1.SyntaxKind.NumericLiteral:
            return n.text;
        default:
            return "UnhandledDeclarationName";
    }
}
function parseTypeMember(member) {
    if (member.name) {
        if (typescript_1.SyntaxKind.PropertyDeclaration == member.kind || typescript_1.SyntaxKind.PropertySignature == member.kind) {
            var x = member;
            return (new NamedValue(parseDeclarationName(x.name), x.type ? parseTypeNode(x.type) : exports.anyType));
        }
        else if (typescript_1.SyntaxKind.MethodSignature == member.kind || typescript_1.SyntaxKind.MethodDeclaration == member.kind) {
            var x = member;
            return (new NamedValue(parseDeclarationName(x.name), parseSignatureType(x)));
        }
        else {
            throw new Error("Unknown type member kind: " + typescript_1.SyntaxKind[member.kind]);
        }
    }
    else if ([typescript_1.SyntaxKind.IndexSignature, typescript_1.SyntaxKind.CallSignature,
        typescript_1.SyntaxKind.ConstructSignature].includes(member.kind)) {
        var sig = member;
        var methodName = sig.kind == typescript_1.SyntaxKind.IndexSignature ? "access"
            : (sig.kind == typescript_1.SyntaxKind.ConstructSignature ? "CONSTRUCTOR" : "call");
        return (new NamedValue(methodName, parseSignatureType(sig)));
    }
    else {
        throw new Error("Unknown type element: " + ts.SyntaxKind[member.kind]);
    }
}
function parseEntityName(n) {
    if (n.kind == typescript_1.SyntaxKind.Identifier) {
        return n.text;
    }
    else {
        return parseEntityName(n.left) + "." + n.right.text;
    }
}
function parseTypeNode(node) {
    if (node.kind == typescript_1.SyntaxKind.AnyKeyword || node.kind == typescript_1.SyntaxKind.ThisKeyword) {
        return exports.anyType;
    }
    else if (ts.isTypeReferenceNode(node)) {
        var n = node;
        return new TVar(parseEntityName(n.typeName));
    }
    else if (basicTypes.has(node.kind)) {
        return new TVar(basicTypes.get(node.kind));
    }
    else if (node.kind == typescript_1.SyntaxKind.ArrayType) {
        return new TVar("Array");
    }
    else if (node.kind == typescript_1.SyntaxKind.FunctionType || node.kind == typescript_1.SyntaxKind.ConstructorType) {
        var n = node;
        var ret = parseTypeNode(n.type);
        var args = n.parameters.map(function (p) {
            return p.type ? parseTypeNode(p.type) : exports.anyType;
        });
        return eliminateTypeVars(new FuncType(args, ret), parseTVars(n));
    }
    else if (node.kind == typescript_1.SyntaxKind.TypeLiteral) {
        var n = node;
        var members = n.members.map(parseTypeMember);
        return new ObjectType(members);
    }
    else if (node.kind == typescript_1.SyntaxKind.UnionType) {
        var n = node;
        if (n.types.length == 2) {
            var second = parseTypeNode(n.types[1]);
            if (second.category == "TVar" &&
                (second.name == "null" || second.name == "undefined")) {
                return parseTypeNode(n.types[0]);
            }
            else {
                return exports.anyType;
            }
        }
        return exports.anyType;
    }
    else if (ignoredTypes.has(node.kind)) {
        return exports.anyType;
    }
    else if (node.kind == typescript_1.SyntaxKind.LiteralType) {
        var n = node;
        switch (n.literal.kind) {
            case typescript_1.SyntaxKind.StringLiteral:
                return new TVar("string");
            case typescript_1.SyntaxKind.TrueKeyword:
            case typescript_1.SyntaxKind.FalseKeyword:
                return new TVar("boolean");
            case typescript_1.SyntaxKind.NumericLiteral:
                return new TVar("number");
            default:
                return exports.anyType;
        }
    }
    else if (node.kind == typescript_1.SyntaxKind.IntersectionType) {
        return exports.anyType;
    }
    else if (node.kind == typescript_1.SyntaxKind.ParenthesizedType) {
        var n = node;
        return parseTypeNode(n.type);
    }
    else if (node.kind == typescript_1.SyntaxKind.FirstTypeNode || node.kind == typescript_1.SyntaxKind.LastTypeNode) {
        return new TVar("boolean");
    }
    else if (node.kind == typescript_1.SyntaxKind.TupleType) {
        return new TVar("Array");
    }
    else if (node.kind == typescript_1.SyntaxKind.TypeQuery) {
        return exports.anyType; // fixme: handle type query
    }
    else {
        throw new Error("Unknown Type Kind: " + ts.SyntaxKind[node.kind]);
    }
}
var NamedValue = /** @class */ (function () {
    function NamedValue(name, value) {
        this.name = name;
        this.value = value;
    }
    return NamedValue;
}());
var Var = /** @class */ (function () {
    function Var(name) {
        this.name = name;
        this.category = "Var";
        this.mark = "missing";
        mustExist(name);
    }
    return Var;
}());
var Const = /** @class */ (function () {
    function Const(value, ty, line) {
        this.value = value;
        this.ty = ty;
        this.line = line;
        this.category = "Const";
        mustExist(value);
        this.mark = new Inferred(ty);
    }
    return Const;
}());
var Cast = /** @class */ (function () {
    function Cast(expr, ty) {
        this.expr = expr;
        this.ty = ty;
        this.category = "Cast";
        mustExist(expr);
        this.mark = new Inferred(ty);
    }
    return Cast;
}());
var FuncCall = /** @class */ (function () {
    function FuncCall(f, args, mark) {
        this.f = f;
        this.args = args;
        this.mark = mark;
        this.category = "FuncCall";
    }
    return FuncCall;
}());
var ObjLiteral = /** @class */ (function () {
    function ObjLiteral(fields, mark) {
        this.fields = fields;
        this.mark = mark;
        this.category = "ObjLiteral";
    }
    return ObjLiteral;
}());
var Access = /** @class */ (function () {
    function Access(expr, field, mark) {
        this.expr = expr;
        this.field = field;
        this.mark = mark;
        this.category = "Access";
        mustExist(field);
    }
    return Access;
}());
var IfExpr = /** @class */ (function () {
    function IfExpr(cond, e1, e2, mark) {
        this.cond = cond;
        this.e1 = e1;
        this.e2 = e2;
        this.mark = mark;
        this.category = "IfExpr";
    }
    return IfExpr;
}());
var VarDef = /** @class */ (function () {
    function VarDef(x, mark, init, isConst, modifiers, srcSpan) {
        this.x = x;
        this.mark = mark;
        this.init = init;
        this.isConst = isConst;
        this.modifiers = modifiers;
        this.srcSpan = srcSpan;
        this.category = "VarDef";
        mustExist(x);
    }
    return VarDef;
}());
var AssignStmt = /** @class */ (function () {
    function AssignStmt(lhs, rhs) {
        this.lhs = lhs;
        this.rhs = rhs;
        this.category = "AssignStmt";
    }
    return AssignStmt;
}());
var ExprStmt = /** @class */ (function () {
    function ExprStmt(expr, isReturn) {
        this.expr = expr;
        this.isReturn = isReturn;
        this.category = "ExprStmt";
    }
    return ExprStmt;
}());
var IfStmt = /** @class */ (function () {
    function IfStmt(cond, branch1, branch2) {
        this.cond = cond;
        this.branch1 = branch1;
        this.branch2 = branch2;
        this.category = "IfStmt";
    }
    return IfStmt;
}());
var WhileStmt = /** @class */ (function () {
    function WhileStmt(cond, body) {
        this.cond = cond;
        this.body = body;
        this.category = "WhileStmt";
    }
    return WhileStmt;
}());
var ImportSingle = /** @class */ (function () {
    function ImportSingle(oldName, newName, path) {
        this.oldName = oldName;
        this.newName = newName;
        this.path = path;
        this.category = "ImportSingle";
    }
    return ImportSingle;
}());
var ImportDefault = /** @class */ (function () {
    function ImportDefault(newName, path) {
        this.newName = newName;
        this.path = path;
        this.category = "ImportDefault";
    }
    return ImportDefault;
}());
var ImportModule = /** @class */ (function () {
    function ImportModule(newName, path) {
        this.newName = newName;
        this.path = path;
        this.category = "ImportModule";
    }
    return ImportModule;
}());
var ExportSingle = /** @class */ (function () {
    function ExportSingle(oldName, newName, from) {
        this.oldName = oldName;
        this.newName = newName;
        this.from = from;
        this.category = "ExportSingle";
    }
    return ExportSingle;
}());
var ExportDefault = /** @class */ (function () {
    function ExportDefault(newName, from) {
        this.newName = newName;
        this.from = from;
        this.category = "ExportDefault";
    }
    return ExportDefault;
}());
var ExportModule = /** @class */ (function () {
    function ExportModule(from) {
        this.from = from;
        this.category = "ExportModule";
    }
    return ExportModule;
}());
var NamespaceAliasStmt = /** @class */ (function () {
    function NamespaceAliasStmt(name, rhs) {
        this.name = name;
        this.rhs = rhs;
        this.category = "NamespaceAliasStmt";
    }
    return NamespaceAliasStmt;
}());
var TypeAliasStmt = /** @class */ (function () {
    function TypeAliasStmt(name, tyVars, type, modifiers, superTypes) {
        this.name = name;
        this.tyVars = tyVars;
        this.type = type;
        this.modifiers = modifiers;
        this.superTypes = superTypes;
        this.category = "TypeAliasStmt";
        mustExist(name);
        mustExist(tyVars);
        mustExist(type);
        mustExist(modifiers);
    }
    return TypeAliasStmt;
}());
var CommentStmt = /** @class */ (function () {
    function CommentStmt(text) {
        this.text = text;
        this.category = "CommentStmt";
        mustExist(text);
    }
    return CommentStmt;
}());
var BlockStmt = /** @class */ (function () {
    function BlockStmt(stmts) {
        this.stmts = stmts;
        this.category = "BlockStmt";
    }
    return BlockStmt;
}());
var NamespaceStmt = /** @class */ (function () {
    function NamespaceStmt(name, block, modifiers) {
        this.name = name;
        this.block = block;
        this.modifiers = modifiers;
        this.category = "NamespaceStmt";
    }
    return NamespaceStmt;
}());
var FuncDef = /** @class */ (function () {
    function FuncDef(name, args, returnType, body, modifiers, tyVars) {
        this.name = name;
        this.args = args;
        this.returnType = returnType;
        this.body = body;
        this.modifiers = modifiers;
        this.tyVars = tyVars;
        this.category = "FuncDef";
        mustExist(name);
    }
    return FuncDef;
}());
var Constructor = /** @class */ (function (_super) {
    __extends(Constructor, _super);
    function Constructor(name, args, returnType, body, modifiers, tyVars, publicVars) {
        var _this = _super.call(this, name, args, [returnType, null], body, modifiers, tyVars) || this;
        _this.publicVars = publicVars;
        mustExist(publicVars);
        return _this;
    }
    return Constructor;
}(FuncDef));
var ClassDef = /** @class */ (function () {
    function ClassDef(name, constr, instanceLambdas, staticLambdas, vars, funcDefs, superTypes, modifiers, tyVars) {
        this.name = name;
        this.constr = constr;
        this.instanceLambdas = instanceLambdas;
        this.staticLambdas = staticLambdas;
        this.vars = vars;
        this.funcDefs = funcDefs;
        this.superTypes = superTypes;
        this.modifiers = modifiers;
        this.tyVars = tyVars;
        this.category = "ClassDef";
    }
    return ClassDef;
}());
function parseExpr(node, allocateLambda, checker) {
    function rec(node) {
        var n = node;
        mustExist(n);
        function infer() {
            return parseGMark(undefined, node, checker);
        }
        switch (n.kind) {
            case typescript_1.SyntaxKind.Identifier: {
                var name_1 = n.text;
                return new Var(name_1);
            }
            case typescript_1.SyntaxKind.ThisKeyword:
                return SpecialVars.THIS;
            case typescript_1.SyntaxKind.SuperKeyword:
                return SpecialVars.SUPER;
            case typescript_1.SyntaxKind.CallExpression: {
                var f = rec(n.expression);
                var args = n.arguments.map(rec);
                return new FuncCall(f, args, infer());
            }
            case typescript_1.SyntaxKind.NewExpression: {
                var args = n.arguments ? n.arguments.map(rec) : [];
                var f = new Access(rec(n.expression), "CONSTRUCTOR", "missing");
                return new FuncCall(f, args, infer());
            }
            case typescript_1.SyntaxKind.ObjectLiteralExpression: {
                var fields = flatMap(n.properties, function (p) {
                    if (p.kind == typescript_1.SyntaxKind.PropertyAssignment ||
                        p.kind == typescript_1.SyntaxKind.ShorthandPropertyAssignment) {
                        return [parseObjectLiteralElementLike(p)];
                    }
                    else {
                        return []; //todo: other cases
                    }
                });
                return new ObjLiteral(fields, infer());
            }
            case typescript_1.SyntaxKind.PropertyAccessExpression: {
                var lhs = rec(n.expression);
                return new Access(lhs, n.name.text, infer());
            }
            case ts.SyntaxKind.ElementAccessExpression: {
                var thing = rec(n.expression);
                var index = rec(n.argumentExpression);
                return new FuncCall(new Access(thing, "access", "missing"), [index], infer());
            }
            case ts.SyntaxKind.ConditionalExpression: {
                var cond = rec(n.condition);
                var e1 = rec(n.whenTrue);
                var e2 = rec(n.whenFalse);
                return new IfExpr(cond, e1, e2, infer());
            }
            case ts.SyntaxKind.ParenthesizedExpression: {
                return rec(n.expression);
            }
            // constants
            case typescript_1.SyntaxKind.NumericLiteral:
                return constExpr("number");
            case typescript_1.SyntaxKind.StringLiteral:
                return constExpr("string");
            case typescript_1.SyntaxKind.RegularExpressionLiteral:
                return constExpr("RegExp");
            case typescript_1.SyntaxKind.TrueKeyword:
            case typescript_1.SyntaxKind.FalseKeyword:
                return constExpr("boolean");
            case typescript_1.SyntaxKind.NullKeyword:
                return constExpr(exports.anyType.name, "null");
            case typescript_1.SyntaxKind.VoidExpression: {
                return constExpr("void", "void");
            }
            case typescript_1.SyntaxKind.ArrayLiteralExpression: {
                var a = node;
                var exs = a.elements.map(rec);
                return new FuncCall(new Var("Array"), exs, infer());
            }
            // operators
            case ts.SyntaxKind.BinaryExpression: {
                var l = rec(n.left);
                var r = rec(n.right);
                var opp = n.operatorToken.kind;
                return new FuncCall(new Var(ts.SyntaxKind[opp]), [l, r], infer());
            }
            case typescript_1.SyntaxKind.PrefixUnaryExpression:
            case typescript_1.SyntaxKind.PostfixUnaryExpression: {
                var opName = ts.SyntaxKind[n["operator"]];
                var fixity = (node.kind == typescript_1.SyntaxKind.PrefixUnaryExpression) ? "" : "POST_";
                var arg = rec(n["operand"]);
                return new FuncCall(new Var(fixity + opName), [arg], infer());
            }
            case typescript_1.SyntaxKind.ArrowFunction:
            case typescript_1.SyntaxKind.FunctionExpression: {
                try {
                    return allocateLambda(n);
                }
                catch (e) {
                    return exports.undefinedValue;
                }
            }
            // Special treatments:
            case typescript_1.SyntaxKind.SpreadElement: {
                var n1 = n.expression;
                return new FuncCall(SpecialVars.spread, [rec(n1)], infer());
            }
            case typescript_1.SyntaxKind.TypeOfExpression: {
                return new FuncCall(SpecialVars.typeOf, [rec(n.expression)], infer());
            }
            case typescript_1.SyntaxKind.TaggedTemplateExpression: {
                var tagE = rec(n.tag);
                var temp = rec(n.template);
                return new FuncCall(tagE, [temp], infer());
            }
            case typescript_1.SyntaxKind.TemplateExpression: {
                var spans = n.templateSpans.map(function (sp) { return rec(sp.expression); });
                return new FuncCall(SpecialVars.Template, spans, infer());
            }
            case typescript_1.SyntaxKind.NoSubstitutionTemplateLiteral:
                return constExpr("string");
            case typescript_1.SyntaxKind.DeleteExpression: {
                return new FuncCall(SpecialVars.DELETE, [rec(n.expression)], infer());
            }
            case typescript_1.SyntaxKind.YieldExpression: {
                return new FuncCall(SpecialVars.YIELD, [rec(mustExist(n.expression))], infer());
            }
            case typescript_1.SyntaxKind.AwaitExpression: {
                return new FuncCall(SpecialVars.AWAIT, [rec(n.expression)], infer());
            }
            case typescript_1.SyntaxKind.NonNullExpression: {
                return rec(n.expression);
            }
            case typescript_1.SyntaxKind.JsxElement:
            case typescript_1.SyntaxKind.JsxSelfClosingElement: {
                return exports.undefinedValue;
            }
            case typescript_1.SyntaxKind.TypeAssertionExpression:
            case typescript_1.SyntaxKind.AsExpression: {
                var e = rec(n.expression);
                var t = parseTypeNode(n.type);
                return new Cast(e, t);
            }
            // type assertions are ignored
            case typescript_1.SyntaxKind.OmittedExpression:
            case typescript_1.SyntaxKind.ImportKeyword:
            case typescript_1.SyntaxKind.MetaProperty:
            case typescript_1.SyntaxKind.ClassExpression: {
                return exports.undefinedValue; //todo: properly handle
            }
            default: {
                throw new Error("Unknown expression category: " + ts.SyntaxKind[node.kind]
                    + ". Text: " + node.getText());
            }
        }
        function constExpr(typeName, value) {
            // let v = (<ts.LiteralLikeNode>node).text;
            var v = value ? value : "???";
            return new Const(v, new TVar(typeName), getLineNumber(n));
        }
        function parseObjectLiteralElementLike(p) {
            //todo: properly handle other cases like accessors
            var fieldName = p.name.getText();
            var rhs = (p.kind == typescript_1.SyntaxKind.PropertyAssignment) ? rec(p.initializer) : new Var(fieldName);
            return new NamedValue(fieldName, rhs);
        }
    }
    return rec(node);
}
exports.parseExpr = parseExpr;
exports.undefinedValue = new Var("undefined");
function parseGMark(tyNode, node, checker) {
    if (!tyNode) {
        if (node) {
            var ty = checker.getTypeAtLocation(node);
            var n = checker.typeToTypeNode(ty);
            var t = n ? parseTypeNode(n) : exports.anyType;
            if (t.category == "AnyType") {
                return "missing";
            }
            else {
                return new Inferred(t);
            }
        }
        else {
            return "missing";
        }
    }
    else {
        return new UserAnnot(parseTypeNode(tyNode));
    }
}
exports.parseGMark = parseGMark;
var StmtParser = /** @class */ (function () {
    function StmtParser(checker) {
        this.checker = checker;
        this.nLambda = [0];
    }
    StmtParser.prototype.parseStmt = function (node) {
        var checker = this.checker;
        function parseMark(tyNode, node) {
            return parseGMark(tyNode, node, checker);
        }
        var getNLambda = this.nLambda;
        var StmtsHolder = /** @class */ (function () {
            function StmtsHolder(stmts) {
                this.stmts = stmts;
            }
            return StmtsHolder;
        }());
        var ExprProcessor = /** @class */ (function () {
            function ExprProcessor() {
                this.lambdaDefs = [];
            }
            ExprProcessor.prototype.processExpr = function (e) {
                var lambdas = this.lambdaDefs;
                function allocateLambda(f) {
                    var n0 = f.name;
                    var name;
                    if (n0) {
                        name = n0.getText();
                    }
                    else {
                        name = "$Lambda" + getNLambda[0];
                        getNLambda[0] += 1;
                    }
                    var srcSpan = n0 ? getSrcSpan(n0) : null;
                    lambdas.push(parseFunction(name, f, parseModifiers(f.modifiers), srcSpan));
                    return new Var(name);
                }
                return parseExpr(e, allocateLambda, checker);
            };
            ExprProcessor.prototype.alongWith = function () {
                var stmts = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    stmts[_i] = arguments[_i];
                }
                return new StmtsHolder(this.lambdaDefs.concat(stmts));
            };
            ExprProcessor.prototype.alongWithMany = function (stmts) {
                return new StmtsHolder(this.lambdaDefs.concat(stmts));
            };
            return ExprProcessor;
        }());
        /**
         * returns the parsed FuncDef along with arguments that are marked
         * with 'public' (for constructors)
         */
        function parseFunction(name, n, modifiers, returnSrcSpan) {
            function inferRetType() {
                if (n.type) {
                    return parseMark(n.type, undefined);
                }
                var tNode = checker.typeToTypeNode(checker.getTypeAtLocation(n));
                if (tNode) {
                    var t = parseTypeNode(tNode);
                    if (t.category == "FuncType") {
                        return new Inferred(t.to);
                    }
                }
                return "missing";
            }
            var isConstructor = ts.isConstructorDeclaration(n);
            var retType = inferRetType();
            var publicArgs = [];
            var bindingInArgs = false;
            var args = n.parameters.map(function (p) {
                var name;
                if (p.name.kind == typescript_1.SyntaxKind.Identifier) {
                    name = p.name.text;
                }
                else {
                    name = "_";
                    bindingInArgs = true;
                }
                if (parseModifiers(p.modifiers).includes("public")) {
                    publicArgs.push(name);
                }
                return new NamedValue(name, [parseMark(p.type, undefined), getSrcSpan(p.name)]);
            });
            var body;
            if (n.kind != typescript_1.SyntaxKind.IndexSignature && n.body && !bindingInArgs) {
                if (n.body.kind == typescript_1.SyntaxKind.Block) {
                    body = rec(n.body);
                }
                else {
                    var ep = new ExprProcessor();
                    // try to parse the body as a ConciseFunction body
                    body = ep.alongWith(new ExprStmt(ep.processExpr(n.body), true));
                }
            }
            else {
                body = new ExprProcessor().alongWithMany([]);
            }
            var type_params = n.typeParameters;
            var t_vars;
            if (type_params) {
                t_vars = type_params.map(function (n) { return n.name.text; });
            }
            else {
                t_vars = [];
            }
            return isConstructor ?
                new Constructor(name, args, retType, flattenBlock(body.stmts), modifiers, t_vars, publicArgs) :
                new FuncDef(name, args, [retType, returnSrcSpan], flattenBlock(body.stmts), modifiers, t_vars);
        }
        function rec(node) {
            return handleError(node, function () {
                mustExist(node);
                var EP = new ExprProcessor();
                function parseVarDecList(node, modifiers, rhs) {
                    return handleError(node, function () {
                        var isConst = (node.flags & ts.NodeFlags.Const) != 0;
                        function parseVarDec(dec, rhs) {
                            var rhs1 = rhs ? rhs : (dec.initializer ? EP.processExpr(dec.initializer) : null);
                            return parseBindingName(dec.name, rhs1, dec.type);
                        }
                        function parseBindingName(lhs, rhs, ty) {
                            switch (lhs.kind) {
                                case typescript_1.SyntaxKind.Identifier:
                                    var vd = new VarDef(lhs.text, parseMark(ty, lhs), rhs, isConst, modifiers, getSrcSpan(lhs));
                                    return [vd];
                                case typescript_1.SyntaxKind.ObjectBindingPattern:
                                    return flatMap(lhs.elements, function (e) {
                                        var fieldName = e.propertyName ? e.propertyName : e.name;
                                        var fName;
                                        switch (fieldName.kind) {
                                            case typescript_1.SyntaxKind.Identifier:
                                            case typescript_1.SyntaxKind.StringLiteral:
                                            case typescript_1.SyntaxKind.ComputedPropertyName:
                                            case typescript_1.SyntaxKind.NumericLiteral:
                                                fName = parsePropertyName(fieldName);
                                                break;
                                            default:
                                                fName = SpecialVars.UNKNOWN;
                                                break;
                                        }
                                        var access = rhs ? new Access(rhs, fName, "missing") : null;
                                        return parseBindingName(e.name, access);
                                    });
                                case typescript_1.SyntaxKind.ArrayBindingPattern: {
                                    var arrayAccessed_1 = rhs ? new FuncCall(SpecialVars.ArrayAccess, [rhs], "missing") : null;
                                    return flatMap(lhs.elements, function (e) {
                                        if (e.kind == typescript_1.SyntaxKind.OmittedExpression) {
                                            return [];
                                        }
                                        else {
                                            return parseBindingName(e.name, arrayAccessed_1);
                                        }
                                    });
                                }
                            }
                        }
                        var dec = node.declarations;
                        return flatMap(dec, function (x) { return parseVarDec(x, rhs); });
                    });
                }
                function isStatic(n) {
                    return parseModifiers(n.modifiers).includes("static");
                }
                switch (node.kind) {
                    case typescript_1.SyntaxKind.ThrowStatement:
                    case typescript_1.SyntaxKind.ExpressionStatement: {
                        var n = node;
                        if (n.expression.kind == typescript_1.SyntaxKind.BinaryExpression) {
                            var e = n.expression;
                            if (e.operatorToken.kind == ts.SyntaxKind.FirstAssignment) {
                                var l = EP.processExpr(e.left);
                                var r = EP.processExpr(e.right);
                                return EP.alongWith(new AssignStmt(l, r));
                            }
                        }
                        var shouldReturn = n.expression.kind == typescript_1.SyntaxKind.YieldExpression;
                        return EP.alongWith(new ExprStmt(EP.processExpr(n.expression), shouldReturn));
                    }
                    case typescript_1.SyntaxKind.ReturnStatement: {
                        var n = node;
                        return n.expression ?
                            EP.alongWith(new ExprStmt(EP.processExpr(n.expression), true))
                            : EP.alongWith(new CommentStmt("return;"));
                    }
                    case typescript_1.SyntaxKind.VariableStatement: {
                        var n = node;
                        var ms = parseModifiers(n.modifiers);
                        var list = n.declarationList;
                        return EP.alongWithMany(parseVarDecList(list, ms));
                    }
                    case typescript_1.SyntaxKind.IfStatement: {
                        var n = node;
                        var cond = EP.processExpr(n.expression);
                        var then = flattenBlock(rec(n.thenStatement).stmts);
                        var otherwise = void 0;
                        if (n.elseStatement == undefined) {
                            otherwise = [new BlockStmt([])];
                        }
                        else {
                            otherwise = rec(n.elseStatement).stmts;
                        }
                        return EP.alongWith(new IfStmt(cond, then, flattenBlock(otherwise)));
                    }
                    case typescript_1.SyntaxKind.DoStatement: // simply treat do as while
                    case typescript_1.SyntaxKind.WhileStatement: {
                        var n = node;
                        var cond = EP.processExpr(n.expression);
                        var body = flattenBlock(rec(n.statement).stmts);
                        return EP.alongWith(new WhileStmt(cond, body));
                    }
                    case typescript_1.SyntaxKind.Block: {
                        var n = node;
                        var stmts = flatMap(n.statements, function (x) { return rec(x).stmts; });
                        return EP.alongWith(new BlockStmt(stmts));
                    }
                    case typescript_1.SyntaxKind.ForOfStatement:
                    case typescript_1.SyntaxKind.ForInStatement:
                    case typescript_1.SyntaxKind.ForStatement: {
                        var n = node;
                        var cond = new Const("true", new TVar("boolean"), getLineNumber(n));
                        var incr = [];
                        var expression = undefined;
                        if (n.kind == typescript_1.SyntaxKind.ForStatement) {
                            if (n.condition) {
                                cond = EP.processExpr(n.condition);
                            }
                            if (n.incrementor) {
                                incr = [new ExprStmt(EP.processExpr(n.incrementor), false)];
                            }
                        }
                        else {
                            var rhs = EP.processExpr(n.expression);
                            expression = new FuncCall(SpecialVars.ArrayAccess, [rhs], "missing");
                        }
                        var init = n.initializer;
                        var outerBlock = new BlockStmt([]);
                        if (init && ts.isVariableDeclarationList(init)) {
                            outerBlock.stmts = parseVarDecList(init, [], expression);
                        }
                        else if (init) {
                            outerBlock.stmts.push(new ExprStmt(EP.processExpr(init), false));
                        }
                        var bodyStmts = rec(n.statement).stmts.concat(incr);
                        outerBlock.stmts.push(new WhileStmt(cond, flattenBlock(bodyStmts)));
                        return EP.alongWith(outerBlock);
                    }
                    case typescript_1.SyntaxKind.FunctionDeclaration:
                    case typescript_1.SyntaxKind.MethodDeclaration:
                    case typescript_1.SyntaxKind.GetAccessor:
                    case typescript_1.SyntaxKind.SetAccessor:
                    case typescript_1.SyntaxKind.Constructor: {
                        var name_2 = (node.kind == typescript_1.SyntaxKind.Constructor) ? "Constructor" :
                            useOrElse(node.name, function (x) { return parsePropertyName(x); }, "defaultFunc");
                        var n = node;
                        var modifiers = parseModifiers(n.modifiers);
                        if (node.kind == typescript_1.SyntaxKind.SetAccessor) {
                            modifiers.push("set");
                        }
                        else if (node.kind == typescript_1.SyntaxKind.GetAccessor) {
                            modifiers.push("get");
                        }
                        var srcSpan = n.name ? getSrcSpan(n.name) : null;
                        return EP.alongWith(parseFunction(name_2, n, modifiers, srcSpan));
                    }
                    case typescript_1.SyntaxKind.ClassDeclaration: {
                        var n = node;
                        var name_3 = n.name ? n.name.text : "DefaultClass";
                        var superTypes = [];
                        if (n.heritageClauses) {
                            var clauses = n.heritageClauses;
                            for (var _i = 0, clauses_1 = clauses; _i < clauses_1.length; _i++) {
                                var c = clauses_1[_i];
                                superTypes.push(c.types[0].expression.getText());
                            }
                        }
                        var vars_1 = [];
                        var funcDefs = [];
                        var constructor = null;
                        // let isAbstract = n.modifiers && n.modifiers.map(x => x.kind).includes(SyntaxKind.AbstractKeyword);
                        var instanceEp = new ExprProcessor();
                        var staticEp = new ExprProcessor();
                        var _loop_1 = function (v) {
                            var staticQ = isStatic(v);
                            var ep = staticQ ? staticEp : instanceEp;
                            if (ts.isPropertyDeclaration(v)) {
                                var v1 = v;
                                var init = v1.initializer ? ep.processExpr(v1.initializer) : null;
                                vars_1.push(new NamedValue(parsePropertyName(v1.name), [parseMark(v1.type, v1), init, staticQ, getSrcSpan(v1.name)]));
                            }
                            else if (ts.isMethodDeclaration(v) || ts.isAccessor(v)) {
                                funcDefs.push([getSingleton(rec(v).stmts), staticQ]);
                            }
                            else if (ts.isConstructorDeclaration(v)) {
                                var c_1 = getSingleton(rec(v).stmts);
                                c_1.args
                                    .filter(function (v) { return c_1.publicVars.includes(v.name); })
                                    .forEach(function (p) { return vars_1.push(new NamedValue(p.name, [p.value[0], null, false, p.value[1]])); });
                                constructor = c_1;
                            }
                            else if (ts.isIndexSignatureDeclaration(v)) {
                                var n_1 = v;
                                var srcSpan = n_1.type ? getSrcSpan(n_1.type) : null;
                                parseFunction("access", n_1, parseModifiers(n_1.modifiers), srcSpan);
                            }
                            else if (ts.isSemicolonClassElement(v)) {
                                // ignore
                            }
                            else {
                                throw new Error("Unknown statements in class definitions: " + typescript_1.SyntaxKind[v.kind]);
                            }
                        };
                        for (var _a = 0, _b = n.members; _a < _b.length; _a++) {
                            var v = _b[_a];
                            _loop_1(v);
                        }
                        var classModifiers = parseModifiers(n.modifiers);
                        var tVars = parseTVars(n);
                        var classStmt = new ClassDef(name_3, constructor, instanceEp.lambdaDefs, staticEp.lambdaDefs, vars_1, funcDefs, superTypes, classModifiers, tVars);
                        return EP.alongWith(classStmt);
                    }
                    case typescript_1.SyntaxKind.SwitchStatement: {
                        var n = node;
                        var switchCall = new FuncCall(SpecialVars.SWITCH, [EP.processExpr(n.expression)], "missing");
                        var clauses = flatMap(n.caseBlock.clauses, function (c) {
                            var body = flatMap(c.statements, function (s) { return rec(s).stmts; });
                            switch (c.kind) {
                                case typescript_1.SyntaxKind.CaseClause:
                                    var f = new FuncCall(SpecialVars.CASE, [EP.processExpr(c.expression)], "missing");
                                    var all = [new ExprStmt(f, false)].concat(body);
                                    return EP.alongWithMany(all).stmts;
                                case typescript_1.SyntaxKind.DefaultClause:
                                    return EP.alongWithMany(body).stmts;
                            }
                        });
                        return EP.alongWithMany([new ExprStmt(switchCall, false)].concat(clauses));
                    }
                    case typescript_1.SyntaxKind.ImportEqualsDeclaration: {
                        var n = node;
                        var rhs = n.moduleReference;
                        if (rhs.kind == typescript_1.SyntaxKind.ExternalModuleReference) {
                            var newName = n.name.text;
                            if (rhs.expression.kind == typescript_1.SyntaxKind.StringLiteral) {
                                var path = rhs.expression.text;
                                return EP.alongWith(new ImportSingle("$ExportEquals", newName, path));
                            }
                            else {
                                throw new Error("Unknown import equals: " + n.getText());
                            }
                        }
                        else {
                            return EP.alongWith(new NamespaceAliasStmt(n.name.getText(), rhs.getText()));
                        }
                    }
                    case typescript_1.SyntaxKind.ImportDeclaration: {
                        var n = node;
                        var path_1 = n.moduleSpecifier.text;
                        if (n.importClause) {
                            if (n.importClause.name) {
                                return EP.alongWith(new ImportDefault(n.importClause.name.text, path_1));
                            }
                            if (n.importClause.namedBindings) {
                                var bindings = n.importClause.namedBindings;
                                if (bindings.kind == typescript_1.SyntaxKind.NamespaceImport) {
                                    return EP.alongWith(new ImportModule(bindings.name.text, path_1));
                                }
                                else {
                                    var imports = bindings.elements.map(function (s) {
                                        var newName = s.name.text;
                                        if (s.propertyName) {
                                            return new ImportSingle(s.propertyName.text, newName, path_1);
                                        }
                                        else {
                                            return new ImportSingle(newName, newName, path_1);
                                        }
                                    });
                                    return EP.alongWithMany(imports);
                                }
                            }
                        }
                        return EP.alongWith();
                    }
                    case typescript_1.SyntaxKind.ExportAssignment: {
                        var n = node;
                        var e = EP.processExpr(n.expression);
                        if (n.isExportEquals == true) {
                            var alias = new NamespaceAliasStmt("$ExportEquals", n.expression.getText());
                            return EP.alongWith(alias);
                            // return EP.alongWith(new VarDef("$ExportEquals", null, e, true,
                            //   ["export"]));
                        }
                        else if (e.category == "Var") {
                            return EP.alongWith(new ExportDefault(e.name, null));
                        }
                        else {
                            return EP.alongWith(new VarDef("defaultVar", parseMark(undefined, n.expression), e, true, ["export", "default"], null));
                        }
                    }
                    case typescript_1.SyntaxKind.NamespaceExportDeclaration: {
                        var n = node;
                        //todo: check if this is the right way
                        var name_4 = n.name.text;
                        return EP.alongWith(new ExportSingle(name_4, name_4, null));
                    }
                    case typescript_1.SyntaxKind.ExportDeclaration: {
                        var n = node;
                        var path_2 = n.moduleSpecifier ? n.moduleSpecifier.text : null;
                        if (n.exportClause) {
                            var clause = n.exportClause;
                            var exports_1 = clause.elements.map(function (s) {
                                var newName = s.name.text;
                                if (s.propertyName) {
                                    return new ExportSingle(s.propertyName.text, newName, path_2);
                                }
                                else {
                                    return new ExportSingle(newName, newName, path_2);
                                }
                            });
                            return EP.alongWithMany(exports_1);
                        }
                        else {
                            return EP.alongWith(new ExportModule(path_2));
                        }
                    }
                    case typescript_1.SyntaxKind.EnumDeclaration: {
                        var enumEquiv_1 = new TVar("number");
                        var n_2 = node;
                        var vars = n_2.members.map(function (member) {
                            var vName = member.name.getText();
                            return new NamedValue(vName, new Const("ENUM", enumEquiv_1, getLineNumber(n_2)));
                        });
                        var rhs = new ObjLiteral(vars, "missing");
                        var mds = parseModifiers(n_2.modifiers);
                        return EP.alongWithMany([
                            new VarDef(n_2.name.text, "missing", rhs, true, mds, getSrcSpan(n_2.name)),
                            new TypeAliasStmt(n_2.name.text, [], enumEquiv_1, mds, [])
                        ]);
                    }
                    case typescript_1.SyntaxKind.InterfaceDeclaration: {
                        var n = node;
                        var superTypes = [];
                        if (n.heritageClauses) {
                            var clauses = n.heritageClauses;
                            for (var _c = 0, clauses_2 = clauses; _c < clauses_2.length; _c++) {
                                var c = clauses_2[_c];
                                superTypes.push(c.types[0].expression.getText());
                            }
                        }
                        var tVars = parseTVars(n);
                        var members = n.members.map(parseTypeMember);
                        var objT = new ObjectType(members);
                        return EP.alongWith(new TypeAliasStmt(n.name.text, tVars, objT, parseModifiers(n.modifiers), superTypes));
                    }
                    case typescript_1.SyntaxKind.TypeAliasDeclaration: {
                        var n = node;
                        var tVars = parseTVars(n);
                        return EP.alongWith(new TypeAliasStmt(n.name.text, tVars, parseTypeNode(n.type), parseModifiers(n.modifiers), []));
                    }
                    case typescript_1.SyntaxKind.TryStatement: {
                        var n = node;
                        var tryPart = rec(n.tryBlock).stmts;
                        var finallyPart = n.finallyBlock ? rec(n.finallyBlock).stmts : [];
                        return EP.alongWithMany(tryPart.concat(finallyPart));
                    }
                    case typescript_1.SyntaxKind.ModuleDeclaration: {
                        var n = node;
                        var name_5 = n.name.text;
                        var body = n.body;
                        if (body) {
                            switch (body.kind) {
                                case ts.SyntaxKind.ModuleBlock: {
                                    var stmts = flatMap(body.statements, function (x) { return rec(x).stmts; });
                                    var modifiers = parseModifiers(n.modifiers);
                                    var r = new NamespaceStmt(name_5, new BlockStmt(stmts), modifiers);
                                    return EP.alongWith(r);
                                }
                                case ts.SyntaxKind.ModuleDeclaration: {
                                    var modifiers = parseModifiers(n.modifiers);
                                    var r = new NamespaceStmt(name_5, new BlockStmt(rec(body).stmts), modifiers);
                                    return EP.alongWith(r);
                                }
                                default:
                                    throw new Error("Module declare body? Text: \n" + body.getText());
                            }
                        }
                        return EP.alongWith();
                    }
                    case typescript_1.SyntaxKind.LabeledStatement: {
                        var n = node;
                        return rec(n.statement);
                    }
                    // ignored statements:
                    case typescript_1.SyntaxKind.DebuggerStatement:
                    case typescript_1.SyntaxKind.BreakStatement:
                    case typescript_1.SyntaxKind.ContinueStatement:
                        return EP.alongWith(new CommentStmt(node.getText()));
                    case typescript_1.SyntaxKind.EmptyStatement:
                        return EP.alongWithMany([]);
                    default:
                        throw new Error("Unknown stmt category: " + ts.SyntaxKind[node.kind]);
                }
            });
        }
        function parsePropertyName(name) {
            switch (name.kind) {
                case ts.SyntaxKind.Identifier:
                    return name.text;
                case ts.SyntaxKind.ComputedPropertyName:
                    return SpecialVars.ComputedPropertyName;
                case ts.SyntaxKind.NumericLiteral:
                    return name.getText();
                case ts.SyntaxKind.StringLiteral:
                    return name.text;
            }
        }
        return rec(node).stmts;
    };
    return StmtParser;
}());
exports.StmtParser = StmtParser;
function parseModifiers(modifiersNode) {
    if (modifiersNode) {
        return flatMap(modifiersNode, function (m) {
            switch (m.kind) {
                case typescript_1.SyntaxKind.ExportKeyword:
                    return ["export"];
                case typescript_1.SyntaxKind.DefaultKeyword:
                    return ["default"];
                case typescript_1.SyntaxKind.ConstKeyword:
                    return ["const"];
                case typescript_1.SyntaxKind.StaticKeyword:
                    return ["static"];
                case typescript_1.SyntaxKind.PublicKeyword:
                    return ["public"];
                case typescript_1.SyntaxKind.AsyncKeyword:
                    return ["async"];
                default:
                    return [];
            }
        });
    }
    return [];
}
function flattenBlock(stmts) {
    if (stmts.length == 1) {
        return stmts[0];
    }
    else {
        return new BlockStmt(stmts);
    }
}
exports.flattenBlock = flattenBlock;
function getSingleton(xs) {
    if (xs.length != 1) {
        throw new Error("Expect a singleton collection, but get: " + xs);
    }
    return xs[0];
}
exports.getSingleton = getSingleton;
var SpecialVars = /** @class */ (function () {
    function SpecialVars() {
    }
    SpecialVars.spread = new Var("$Spread");
    SpecialVars.typeOf = new Var("$TypeOf");
    SpecialVars.THIS = new Var("this");
    SpecialVars.SUPER = new Var("super");
    SpecialVars.CASE = new Var("$Case");
    SpecialVars.SWITCH = new Var("$Switch");
    SpecialVars.DELETE = new Var("$Delete");
    SpecialVars.ArrayAccess = new Var("$ArrayAccess");
    SpecialVars.YIELD = new Var("$Yield");
    SpecialVars.AWAIT = new Var("$Await");
    SpecialVars.Template = new Var("$Template");
    SpecialVars.ComputedPropertyName = "$ComputedPropertyName";
    SpecialVars.UNKNOWN = "$UNKNOWN";
    return SpecialVars;
}());
// utilities
function flatMap(xs, f) {
    return xs.reduce(function (acc, x) { return acc.concat(f(x)); }, []);
}
exports.flatMap = flatMap;
function forNode(node, action) {
    try {
        return action();
    }
    catch (e) {
        console.debug("Error occurred when processing node: " + node.getText());
        throw e;
    }
}
exports.forNode = forNode;
function getLineNumber(node) {
    var src = node.getSourceFile();
    var line = src.getLineAndCharacterOfPosition(node.getStart()).line;
    return line + 1;
}
exports.getLineNumber = getLineNumber;
function getSrcSpan(node) {
    var src = node.getSourceFile();
    var start = src.getLineAndCharacterOfPosition(node.getStart());
    var end = src.getLineAndCharacterOfPosition(node.getEnd());
    return [[start.line, start.character], [end.line, end.character]];
}
exports.getSrcSpan = getSrcSpan;
function parseFiles(sources, libraryFiles) {
    var program = ts.createProgram(libraryFiles, {
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.CommonJS
    });
    program.getSemanticDiagnostics(undefined, undefined); //call this to store type info into nodes
    var checker = program.getTypeChecker(); // must call this to link source files to nodes
    var warnnings = [];
    var sFiles = sources
        .map(function (file) { return mustExist(program.getSourceFile(file), "getSourceFile failed for: " + file); })
        .filter(function (sc) {
        var noError = program.getSyntacticDiagnostics(sc).length == 0;
        if (!noError) {
            warnnings.push("file " + sc.fileName + " has syntactic error, skipped.");
        }
        return noError;
    });
    mustExist(sFiles);
    var parser = new StmtParser(checker);
    return [sFiles.map(function (src, index) {
            var stmts = [];
            src.statements.forEach(function (s) {
                try {
                    var r = parser.parseStmt(s);
                    r.forEach(function (s) { return stmts.push(s); });
                }
                catch (e) {
                    console.error("Parsing failed for file: " + src.fileName);
                    throw e;
                }
            });
            return new GModule(sources[index], stmts);
        }), warnnings];
}
exports.parseFiles = parseFiles;
function handleError(node, thunk) {
    // return thunk();
    try {
        return thunk();
    }
    catch (e) {
        var line = getLineNumber(node);
        console.log("Failure occurred at line " + line + ": " + node.getText());
        console.log("Error message: " + e.message);
        throw e;
    }
}
function useOrElse(v, f, backup) {
    if (v) {
        return f(v);
    }
    else {
        return backup;
    }
}
