/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "(pages-dir-node)/./context/UserContext.js":
/*!********************************!*\
  !*** ./context/UserContext.js ***!
  \********************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   UserProvider: () => (/* binding */ UserProvider),\n/* harmony export */   useUser: () => (/* binding */ useUser)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next-auth/react */ \"next-auth/react\");\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_auth_react__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! axios */ \"axios\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([axios__WEBPACK_IMPORTED_MODULE_3__]);\naxios__WEBPACK_IMPORTED_MODULE_3__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\n\nconst UserContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)();\nfunction UserProvider({ children }) {\n    const { data: session } = (0,next_auth_react__WEBPACK_IMPORTED_MODULE_2__.useSession)();\n    const [userPoints, setUserPoints] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const [isLoading, setIsLoading] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(true);\n    const [userProducts, setUserProducts] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]); // ✅ เพิ่ม state สำหรับสินค้าผู้ใช้\n    const fetchUserData = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)({\n        \"UserProvider.useCallback[fetchUserData]\": async ()=>{\n            if (!session?.user?.id && !session?.user?.discordId) {\n                setUserPoints(null);\n                setUserProducts([]);\n                setIsLoading(false);\n                return;\n            }\n            try {\n                const discordId = session.user.discordId || session.user.id;\n                const res = await axios__WEBPACK_IMPORTED_MODULE_3__[\"default\"].get(`/api/user?discordId=${discordId}`);\n                setUserPoints(res.data.points || 0);\n                setUserProducts(res.data.products || []); // ✅ ดึง products จาก API\n            } catch (error) {\n                console.error(\"Error fetching user data:\", error);\n                setUserPoints(0);\n                setUserProducts([]);\n            } finally{\n                setIsLoading(false);\n            }\n        }\n    }[\"UserProvider.useCallback[fetchUserData]\"], [\n        session\n    ]);\n    const refreshPoints = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)({\n        \"UserProvider.useCallback[refreshPoints]\": async ()=>{\n            setIsLoading(true);\n            await fetchUserData();\n        }\n    }[\"UserProvider.useCallback[refreshPoints]\"], [\n        fetchUserData\n    ]);\n    // Save user to DB + fetch data\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)({\n        \"UserProvider.useEffect\": ()=>{\n            if (!session) return;\n            ({\n                \"UserProvider.useEffect\": async ()=>{\n                    try {\n                        if (session?.user?.id) {\n                            await axios__WEBPACK_IMPORTED_MODULE_3__[\"default\"].post(\"/api/user\", {\n                                discordId: session.user.id,\n                                name: session.user.name,\n                                email: session.user.email\n                            });\n                        }\n                    } catch (err) {\n                        console.error(\"Save user error:\", err);\n                    }\n                    await fetchUserData();\n                }\n            })[\"UserProvider.useEffect\"]();\n        }\n    }[\"UserProvider.useEffect\"], [\n        session,\n        fetchUserData\n    ]);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(UserContext.Provider, {\n        value: {\n            userPoints,\n            isLoading,\n            refreshPoints,\n            setUserPoints,\n            userProducts\n        },\n        children: children\n    }, void 0, false, {\n        fileName: \"D:\\\\Jayther\\\\CloudStore\\\\context\\\\UserContext.js\",\n        lineNumber: 61,\n        columnNumber: 5\n    }, this);\n}\nfunction useUser() {\n    return (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(UserContext);\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL2NvbnRleHQvVXNlckNvbnRleHQuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFvRjtBQUN2QztBQUNuQjtBQUUxQixNQUFNTyw0QkFBY1Asb0RBQWFBO0FBRTFCLFNBQVNRLGFBQWEsRUFBRUMsUUFBUSxFQUFFO0lBQ3ZDLE1BQU0sRUFBRUMsTUFBTUMsT0FBTyxFQUFFLEdBQUdOLDJEQUFVQTtJQUNwQyxNQUFNLENBQUNPLFlBQVlDLGNBQWMsR0FBR1YsK0NBQVFBLENBQUM7SUFDN0MsTUFBTSxDQUFDVyxXQUFXQyxhQUFhLEdBQUdaLCtDQUFRQSxDQUFDO0lBQzNDLE1BQU0sQ0FBQ2EsY0FBY0MsZ0JBQWdCLEdBQUdkLCtDQUFRQSxDQUFDLEVBQUUsR0FBRyxtQ0FBbUM7SUFFekYsTUFBTWUsZ0JBQWdCZCxrREFBV0E7bURBQUM7WUFDaEMsSUFBSSxDQUFDTyxTQUFTUSxNQUFNQyxNQUFNLENBQUNULFNBQVNRLE1BQU1FLFdBQVc7Z0JBQ25EUixjQUFjO2dCQUNkSSxnQkFBZ0IsRUFBRTtnQkFDbEJGLGFBQWE7Z0JBQ2I7WUFDRjtZQUVBLElBQUk7Z0JBQ0YsTUFBTU0sWUFBWVYsUUFBUVEsSUFBSSxDQUFDRSxTQUFTLElBQUlWLFFBQVFRLElBQUksQ0FBQ0MsRUFBRTtnQkFDM0QsTUFBTUUsTUFBTSxNQUFNaEIsaURBQVMsQ0FBQyxDQUFDLG9CQUFvQixFQUFFZSxXQUFXO2dCQUM5RFIsY0FBY1MsSUFBSVosSUFBSSxDQUFDYyxNQUFNLElBQUk7Z0JBQ2pDUCxnQkFBZ0JLLElBQUlaLElBQUksQ0FBQ2UsUUFBUSxJQUFJLEVBQUUsR0FBRyx5QkFBeUI7WUFDckUsRUFBRSxPQUFPQyxPQUFPO2dCQUNkQyxRQUFRRCxLQUFLLENBQUMsNkJBQTZCQTtnQkFDM0NiLGNBQWM7Z0JBQ2RJLGdCQUFnQixFQUFFO1lBQ3BCLFNBQVU7Z0JBQ1JGLGFBQWE7WUFDZjtRQUNGO2tEQUFHO1FBQUNKO0tBQVE7SUFFWixNQUFNaUIsZ0JBQWdCeEIsa0RBQVdBO21EQUFDO1lBQ2hDVyxhQUFhO1lBQ2IsTUFBTUc7UUFDUjtrREFBRztRQUFDQTtLQUFjO0lBRWxCLCtCQUErQjtJQUMvQmhCLGdEQUFTQTtrQ0FBQztZQUNSLElBQUksQ0FBQ1MsU0FBUztZQUVkOzBDQUFDO29CQUNDLElBQUk7d0JBQ0YsSUFBSUEsU0FBU1EsTUFBTUMsSUFBSTs0QkFDckIsTUFBTWQsa0RBQVUsQ0FBQyxhQUFhO2dDQUM1QmUsV0FBV1YsUUFBUVEsSUFBSSxDQUFDQyxFQUFFO2dDQUMxQlUsTUFBTW5CLFFBQVFRLElBQUksQ0FBQ1csSUFBSTtnQ0FDdkJDLE9BQU9wQixRQUFRUSxJQUFJLENBQUNZLEtBQUs7NEJBQzNCO3dCQUNGO29CQUNGLEVBQUUsT0FBT0MsS0FBSzt3QkFDWkwsUUFBUUQsS0FBSyxDQUFDLG9CQUFvQk07b0JBQ3BDO29CQUNBLE1BQU1kO2dCQUNSOztRQUNGO2lDQUFHO1FBQUNQO1FBQVNPO0tBQWM7SUFFM0IscUJBQ0UsOERBQUNYLFlBQVkwQixRQUFRO1FBQUNDLE9BQU87WUFDM0J0QjtZQUNBRTtZQUNBYztZQUNBZjtZQUNBRztRQUNGO2tCQUNHUDs7Ozs7O0FBR1A7QUFFTyxTQUFTMEI7SUFDZCxPQUFPbEMsaURBQVVBLENBQUNNO0FBQ3BCIiwic291cmNlcyI6WyJEOlxcSmF5dGhlclxcQ2xvdWRTdG9yZVxcY29udGV4dFxcVXNlckNvbnRleHQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlQ29udGV4dCwgdXNlQ29udGV4dCwgdXNlRWZmZWN0LCB1c2VTdGF0ZSwgdXNlQ2FsbGJhY2sgfSBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IHVzZVNlc3Npb24gfSBmcm9tICduZXh0LWF1dGgvcmVhY3QnO1xyXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xyXG5cclxuY29uc3QgVXNlckNvbnRleHQgPSBjcmVhdGVDb250ZXh0KCk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gVXNlclByb3ZpZGVyKHsgY2hpbGRyZW4gfSkge1xyXG4gIGNvbnN0IHsgZGF0YTogc2Vzc2lvbiB9ID0gdXNlU2Vzc2lvbigpO1xyXG4gIGNvbnN0IFt1c2VyUG9pbnRzLCBzZXRVc2VyUG9pbnRzXSA9IHVzZVN0YXRlKG51bGwpO1xyXG4gIGNvbnN0IFtpc0xvYWRpbmcsIHNldElzTG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKTtcclxuICBjb25zdCBbdXNlclByb2R1Y3RzLCBzZXRVc2VyUHJvZHVjdHNdID0gdXNlU3RhdGUoW10pOyAvLyDinIUg4LmA4Lie4Li04LmI4LihIHN0YXRlIOC4quC4s+C4q+C4o+C4seC4muC4quC4tOC4meC4hOC5ieC4suC4nOC4ueC5ieC5g+C4iuC5iVxyXG5cclxuICBjb25zdCBmZXRjaFVzZXJEYXRhID0gdXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xyXG4gICAgaWYgKCFzZXNzaW9uPy51c2VyPy5pZCAmJiAhc2Vzc2lvbj8udXNlcj8uZGlzY29yZElkKSB7XHJcbiAgICAgIHNldFVzZXJQb2ludHMobnVsbCk7XHJcbiAgICAgIHNldFVzZXJQcm9kdWN0cyhbXSk7XHJcbiAgICAgIHNldElzTG9hZGluZyhmYWxzZSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZGlzY29yZElkID0gc2Vzc2lvbi51c2VyLmRpc2NvcmRJZCB8fCBzZXNzaW9uLnVzZXIuaWQ7XHJcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGF4aW9zLmdldChgL2FwaS91c2VyP2Rpc2NvcmRJZD0ke2Rpc2NvcmRJZH1gKTtcclxuICAgICAgc2V0VXNlclBvaW50cyhyZXMuZGF0YS5wb2ludHMgfHwgMCk7XHJcbiAgICAgIHNldFVzZXJQcm9kdWN0cyhyZXMuZGF0YS5wcm9kdWN0cyB8fCBbXSk7IC8vIOKchSDguJTguLbguIcgcHJvZHVjdHMg4LiI4Liy4LiBIEFQSVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGZldGNoaW5nIHVzZXIgZGF0YTpcIiwgZXJyb3IpO1xyXG4gICAgICBzZXRVc2VyUG9pbnRzKDApO1xyXG4gICAgICBzZXRVc2VyUHJvZHVjdHMoW10pO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgc2V0SXNMb2FkaW5nKGZhbHNlKTtcclxuICAgIH1cclxuICB9LCBbc2Vzc2lvbl0pO1xyXG5cclxuICBjb25zdCByZWZyZXNoUG9pbnRzID0gdXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xyXG4gICAgc2V0SXNMb2FkaW5nKHRydWUpO1xyXG4gICAgYXdhaXQgZmV0Y2hVc2VyRGF0YSgpO1xyXG4gIH0sIFtmZXRjaFVzZXJEYXRhXSk7XHJcbiAgXHJcbiAgLy8gU2F2ZSB1c2VyIHRvIERCICsgZmV0Y2ggZGF0YVxyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBpZiAoIXNlc3Npb24pIHJldHVybjtcclxuICAgIFxyXG4gICAgKGFzeW5jICgpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBpZiAoc2Vzc2lvbj8udXNlcj8uaWQpIHtcclxuICAgICAgICAgIGF3YWl0IGF4aW9zLnBvc3QoXCIvYXBpL3VzZXJcIiwge1xyXG4gICAgICAgICAgICBkaXNjb3JkSWQ6IHNlc3Npb24udXNlci5pZCxcclxuICAgICAgICAgICAgbmFtZTogc2Vzc2lvbi51c2VyLm5hbWUsXHJcbiAgICAgICAgICAgIGVtYWlsOiBzZXNzaW9uLnVzZXIuZW1haWwsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJTYXZlIHVzZXIgZXJyb3I6XCIsIGVycik7XHJcbiAgICAgIH1cclxuICAgICAgYXdhaXQgZmV0Y2hVc2VyRGF0YSgpO1xyXG4gICAgfSkoKTtcclxuICB9LCBbc2Vzc2lvbiwgZmV0Y2hVc2VyRGF0YV0pO1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPFVzZXJDb250ZXh0LlByb3ZpZGVyIHZhbHVlPXt7IFxyXG4gICAgICB1c2VyUG9pbnRzLCBcclxuICAgICAgaXNMb2FkaW5nLCBcclxuICAgICAgcmVmcmVzaFBvaW50cywgXHJcbiAgICAgIHNldFVzZXJQb2ludHMsXHJcbiAgICAgIHVzZXJQcm9kdWN0cywgLy8g4pyFIOC4quC5iOC4hyBwcm9kdWN0cyDguK3guK3guIHguYTguJtcclxuICAgIH19PlxyXG4gICAgICB7Y2hpbGRyZW59XHJcbiAgICA8L1VzZXJDb250ZXh0LlByb3ZpZGVyPlxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1c2VVc2VyKCkge1xyXG4gIHJldHVybiB1c2VDb250ZXh0KFVzZXJDb250ZXh0KTtcclxufSJdLCJuYW1lcyI6WyJjcmVhdGVDb250ZXh0IiwidXNlQ29udGV4dCIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwidXNlQ2FsbGJhY2siLCJ1c2VTZXNzaW9uIiwiYXhpb3MiLCJVc2VyQ29udGV4dCIsIlVzZXJQcm92aWRlciIsImNoaWxkcmVuIiwiZGF0YSIsInNlc3Npb24iLCJ1c2VyUG9pbnRzIiwic2V0VXNlclBvaW50cyIsImlzTG9hZGluZyIsInNldElzTG9hZGluZyIsInVzZXJQcm9kdWN0cyIsInNldFVzZXJQcm9kdWN0cyIsImZldGNoVXNlckRhdGEiLCJ1c2VyIiwiaWQiLCJkaXNjb3JkSWQiLCJyZXMiLCJnZXQiLCJwb2ludHMiLCJwcm9kdWN0cyIsImVycm9yIiwiY29uc29sZSIsInJlZnJlc2hQb2ludHMiLCJwb3N0IiwibmFtZSIsImVtYWlsIiwiZXJyIiwiUHJvdmlkZXIiLCJ2YWx1ZSIsInVzZVVzZXIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(pages-dir-node)/./context/UserContext.js\n");

/***/ }),

/***/ "(pages-dir-node)/./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/react */ \"next-auth/react\");\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_auth_react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _context_UserContext__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../context/UserContext */ \"(pages-dir-node)/./context/UserContext.js\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../styles/globals.css */ \"(pages-dir-node)/./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_3__);\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_context_UserContext__WEBPACK_IMPORTED_MODULE_2__]);\n_context_UserContext__WEBPACK_IMPORTED_MODULE_2__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\n\nfunction MyApp({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_auth_react__WEBPACK_IMPORTED_MODULE_1__.SessionProvider, {\n        session: pageProps.session,\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_context_UserContext__WEBPACK_IMPORTED_MODULE_2__.UserProvider, {\n            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                ...pageProps\n            }, void 0, false, {\n                fileName: \"D:\\\\Jayther\\\\CloudStore\\\\pages\\\\_app.js\",\n                lineNumber: 9,\n                columnNumber: 9\n            }, this)\n        }, void 0, false, {\n            fileName: \"D:\\\\Jayther\\\\CloudStore\\\\pages\\\\_app.js\",\n            lineNumber: 8,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"D:\\\\Jayther\\\\CloudStore\\\\pages\\\\_app.js\",\n        lineNumber: 7,\n        columnNumber: 5\n    }, this);\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyApp);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3BhZ2VzL19hcHAuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQWtEO0FBQ0k7QUFDdkI7QUFFL0IsU0FBU0UsTUFBTSxFQUFFQyxTQUFTLEVBQUVDLFNBQVMsRUFBRTtJQUNyQyxxQkFDRSw4REFBQ0osNERBQWVBO1FBQUNLLFNBQVNELFVBQVVDLE9BQU87a0JBQ3pDLDRFQUFDSiw4REFBWUE7c0JBQ1gsNEVBQUNFO2dCQUFXLEdBQUdDLFNBQVM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJaEM7QUFFQSxpRUFBZUYsS0FBS0EsRUFBQyIsInNvdXJjZXMiOlsiRDpcXEpheXRoZXJcXENsb3VkU3RvcmVcXHBhZ2VzXFxfYXBwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNlc3Npb25Qcm92aWRlciB9IGZyb20gXCJuZXh0LWF1dGgvcmVhY3RcIjtcclxuaW1wb3J0IHsgVXNlclByb3ZpZGVyIH0gZnJvbSBcIi4uL2NvbnRleHQvVXNlckNvbnRleHRcIjtcclxuaW1wb3J0IFwiLi4vc3R5bGVzL2dsb2JhbHMuY3NzXCI7XHJcblxyXG5mdW5jdGlvbiBNeUFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH0pIHtcclxuICByZXR1cm4gKFxyXG4gICAgPFNlc3Npb25Qcm92aWRlciBzZXNzaW9uPXtwYWdlUHJvcHMuc2Vzc2lvbn0+XHJcbiAgICAgIDxVc2VyUHJvdmlkZXI+XHJcbiAgICAgICAgPENvbXBvbmVudCB7Li4ucGFnZVByb3BzfSAvPlxyXG4gICAgICA8L1VzZXJQcm92aWRlcj5cclxuICAgIDwvU2Vzc2lvblByb3ZpZGVyPlxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IE15QXBwOyJdLCJuYW1lcyI6WyJTZXNzaW9uUHJvdmlkZXIiLCJVc2VyUHJvdmlkZXIiLCJNeUFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyIsInNlc3Npb24iXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(pages-dir-node)/./pages/_app.js\n");

/***/ }),

/***/ "(pages-dir-node)/./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "axios":
/*!************************!*\
  !*** external "axios" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = import("axios");;

/***/ }),

/***/ "next-auth/react":
/*!**********************************!*\
  !*** external "next-auth/react" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("next-auth/react");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(pages-dir-node)/./pages/_app.js"));
module.exports = __webpack_exports__;

})();