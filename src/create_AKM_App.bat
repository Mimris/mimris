cls

@echo OFF
echo.***********************************
echo.Enter project name (no spaces) to create, then press enter.
echo.
echo. 	NOTE: If the project already exists, it will be deleted. 
echo.	Please verify before proceeding. Press Ctrl + C to abort.
echo.
echo. 	This script will create a new project by the name you specify
echo.	then create the default files and add some default configurations
echo.	to expedite the setup and development process.
echo.
echo.	Project Directory Structure:
echo.	  - dist (build directory)
echo.	    - index.html (output of app)	
echo.	  - node_modules (installed npm modules - ignore)
echo.	  - src (development directory)
echo.	    - index.js (entry into app)
echo.
echo.	  -- ROOT FILES --
echo.
echo.	  .babelrc (contains babel presets)
echo.
echo.	  package.json (dependencies, scripts for building app)
echo.	  package-lock.json (contains npm module info - leave in project, but ignore)
echo.
echo.	  webpack.config.js (configuring JS/CSS for earlier browser support)
echo.
echo.	NPM Installations/Dependencies:
echo.	  - Webpack
echo.	  - Babel
echo.	  - React
echo.
echo.***********************************
echo.

For /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
For /f "tokens=1-2 delims=/:" %%a in ("%TIME%") do (set mytime=%%a%%b)
set timestamp=%mydate%%mytime%

set projectsFolder=C:\CodeProjects
set logFile="%projectsFolder%\%project%-%timestamp%.txt"

set /P project=Enter project name: 
echo.

set projectRootFolder=%projectsFolder%\%project%
set projectSrcFolder=%projectRootFolder%\src
set projectDistFolder=%projectRootFolder%\dist
cd %projectsFolder%

if exist %projectRootFolder% (
	cd %projectRootFolder%
	attrib -R /S
	call :LOGFILE Removed %project% read-only attribute
	cd %projectsFolder%
	RMDIR %projectRootFolder% /S /Q 2>nul
	call :LOGFILE Deleted %projectRootFolder%
)

md %projectRootFolder%
call :LOGFILE Created %projectRootFolder%

cd %projectRootFolder%

echo.
echo.***********************************
echo.
echo.CREATE FILES
echo.
echo.***********************************
echo.

set filename=README.txt
call :LOGFILE Created %projectRootFolder%\%filename% 2>%filename%

@echo.READ ME >> %filename%
@echo.>> %filename%
@echo.package.example.json -- This file is included just in case the generated package.json was not created properly >> %filename%
@echo.due to locks. The npm versions may differ. It's only a reference file and may be deleted. >> %filename%
@echo.>> %filename%
@echo.================================================================= >> %filename%
@echo.>> %filename% 
@echo.webpack.config.js -- This config file should be updated to support your application. >> %filename% 
@echo.>> %filename%
@echo.================================================================= >> %filename%
@echo.>> %filename%
@echo.Update the package.json file and add the following script properties: >> %filename%
@echo.>> %filename%
@echo."scripts": { >> %filename%
@echo.    "start": "npm run build", >> %filename%
@echo.    "build": "webpack -d && webpack-dev-server --config ./webpack.config.js --open" >> %filename%
@echo. } >> %filename%
@echo.>> %filename%
@echo.================================================================= >> %filename%
@echo.>> %filename% 
@echo.To start your application: >> %filename% 
@echo.npm run start (from %project% root folder) >> %filename%
@echo.>> %filename%
 
set filename=package.example.json
call :LOGFILE Created %projectRootFolder%\%filename% 2>%filename%

@echo { >> %filename%
@echo   "name": ^"%project%^", >> %filename%
@echo   "version": "1.0.0", >> %filename%
@echo   "description": "", >> %filename%
@echo   "main": "src/index.js", >> %filename%
@echo   "scripts": { >> %filename%
@echo     "test": "echo \"Error: no test specified\" && exit 1", >> %filename%
@echo     "start": "npm run build10", >> %filename%
@echo     "build10": "webpack -d && webpack-dev-server --config ./%filename% --open", >> %filename%
@echo     "build20": "webpack-dev-server --mode development --open", >> %filename%
@echo     "build20.1": "webpack-dev-server --port 8080", >> %filename%
@echo     "build30": "webpack -d && webpack-dev-server --content-base src/ --inline --hot --port 8080", >> %filename%
@echo     "build30.1": "webpack -d && webpack-dev-server --content-base src/ --inline --port 8080" >> %filename%
@echo   }, >> %filename%
@echo   "author": "Brian Gaines", >> %filename%
@echo   "license": "MIT", >> %filename%
@echo   "devDependencies": { >> %filename%
@echo     "babel-core": "^6.26.2", >> %filename%
@echo     "babel-loader": "^7.1.4", >> %filename%
@echo     "babel-preset-env": "^1.6.1", >> %filename%
@echo     "babel-preset-react": "^6.24.1", >> %filename%
@echo     "babel-preset-stage-2": "^6.24.1", >> %filename%
@echo     "webpack": "^4.6.0", >> %filename%
@echo     "webpack-cli": "^2.0.15", >> %filename%
@echo     "webpack-dev-server": "^3.1.3", >> %filename%
@echo     "css-loader": "^0.28.11", >> %filename%
@echo     "style-loader": "^0.21.0" >> %filename%
@echo   }, >> %filename%
@echo   "dependencies": { >> %filename%
@echo     "react": "^16.3.2", >> %filename%
@echo     "react-dom": "^16.3.2" >> %filename%
@echo   } >> %filename%
@echo } >> %filename%

set filename=webpack.config.js
call :LOGFILE Created %projectRootFolder%\%filename% 2>%filename%

@echo const path = require('path'); >> %filename%
@echo const webpack = require('webpack'); >> %filename%
@echo.>> %filename%
@echo const getSrcPath = (pathAndName, fext) =^> { >> %filename%
@echo     return new RegExp(pathAndName + '\\' + path.sep + '([^^' + '\\' + path.sep + ']+.' + fext + ')'); >> %filename%
@echo }; >> %filename%
@echo.>> %filename%
@echo module.exports = { >> %filename%
@echo   mode: "development", >> %filename%
@echo   //entry: [ >> %filename%
@echo   //  'react-hot-loader/patch', >> %filename%
@echo   //  './src/index.js' >> %filename%
@echo   //], >> %filename%
@echo   entry: { >> %filename%
@echo     page1: path.join(__dirname, 'src') + '/index.js', >> %filename%
@echo   }, >> %filename%
@echo   output: { >> %filename%
@echo     path: path.join(__dirname, 'dist'), >> %filename%
@echo     publicPath: "/", >> %filename%
@echo     filename: '[name].bundle.js' >> %filename%
@echo   }, >> %filename%
@echo   module: { >> %filename%
@echo     rules: [ >> %filename%
@echo       { >> %filename%
@echo         test: /\.jsx?$/, >> %filename%
@echo         include: path.join(__dirname, 'src'), >> %filename%
@echo         exclude: /node_modules/, >> %filename%
@echo         loader: 'babel-loader', >> %filename%
@echo         query: { >> %filename%
@echo           presets: ['react', 'env'] >> %filename%
@echo         } >> %filename%
@echo       }, >> %filename%
@echo       { >> %filename%
@echo         test: /\.css$/, >> %filename%
@echo         loader: 'style-loader!css-loader' >> %filename%
@echo       } >> %filename%
@echo     ] >> %filename%
@echo   }, >> %filename%
@echo   resolve: { >> %filename%
@echo     extensions: ['*', '.js', '.jsx'] >> %filename%
@echo   }, >> %filename%
@echo   optimization: { >> %filename%
@echo       splitChunks: { >> %filename%
@echo           cacheGroups: { >> %filename%
@echo               Page1: { >> %filename%
@echo                   test: getSrcPath("src\\page1","(js|ts)"), >> %filename%
@echo                   chunks: "initial", >> %filename%
@echo                   name: "page1", >> %filename%
@echo                   enforce: true, >> %filename%
@echo               } >> %filename%
@echo           } >> %filename%
@echo       } >> %filename%
@echo   }, >> %filename%
@echo   devServer: { >> %filename%
@echo     host: "localhost", >> %filename%
@echo     port: 8080, >> %filename%
@echo     contentBase: path.join(__dirname, 'dist'), >> %filename%
@echo     hot: true >> %filename%
@echo   }, >> %filename%
@echo   plugins: [ >> %filename%
@echo     new webpack.HotModuleReplacementPlugin() >> %filename%
@echo   ] >> %filename%
@echo }; >> %filename%

set filename=.babelrc
call :LOGFILE Created %projectRootFolder%\%filename% 2>%filename%

@echo { >> .babelrc
@echo     "presets": [ >> .babelrc
@echo         "env", >> .babelrc
@echo         "react" >> .babelrc
rem @echo         "stage-2" >> .babelrc
@echo     ] >> .babelrc
@echo } >> .babelrc

md dist src
cd %projectDistFolder%

set filename=index.html
call :LOGFILE Created %projectDistFolder%\%filename% 2>%filename%

@echo ^<!DOCTYPE html^> >> %filename%
@echo ^<html lang="en" dir="ltr"^> >> %filename%
@echo     ^<head^> >> %filename%
@echo	      ^<meta charset="utf-8"^> >> %filename%
@echo         ^<title^>%project%^</title^> >> %filename%
@echo     ^</head^> >> %filename%
@echo     ^<body^> >> %filename%
@echo         ^<div id="app">^</div^> >> %filename%
@echo         ^<script src="/page1.bundle.js">^</script^> >> %filename%
@echo     ^</body^> >> %filename%
@echo ^</html^> >> %filename%

cd %projectSrcFolder%

set filename=index.js
call :LOGFILE Created %projectSrcFolder%\%filename% 2>%filename%

@echo import React from 'react'; >> %filename%
@echo import ReactDOM from 'react-dom'; >> %filename%
@echo.>> %filename%
@echo const title = '%project% :: React Webpack Babel Project'; >> %filename%
@echo.>> %filename%
@echo ReactDOM.render( >> %filename%
@echo     ^<div^>{title}^</div^>, >> %filename%
@echo     document.getElementById('app') >> %filename%
@echo ); >> %filename%
@echo.>> %filename%
@echo module.hot.accept(); >> %filename%

cd %projectRootFolder%

echo.
echo.***********************************
echo.
echo.NPM INSTALLATIONS
echo.
echo.***********************************
echo.

call :LOGFILE Create "package.json" with defaults
call npm init -y

call :LOGFILE Install webpack-cli, webpack, webpack-dev-server as dev dependency
call npm i -D webpack-cli webpack webpack-dev-server

call :LOGFILE Install babel-core, babel-loader, babel-preset-env as dev dependency
call npm i -D babel-core babel-loader babel-preset-env

rem echo Install babel-preset-stage2 as dev dependency
rem call npm i -D babel-preset-stage2

call :LOGFILE Install babel-preset-react as dev dependency
call npm i -D babel-preset-react

call :LOGFILE Install react, react-dom as project dependencies
call npm i -S react react-dom

call :LOGFILE Install react-hot-loader as dev dependency
call npm i -D react-hot-loader

call :LOGFILE Install css-loader, style-loader as dev dependency
call npm i -D css-loader style-loader 

cd %projectsFolder%

%SystemRoot%\explorer.exe %projectRootFolder%

echo.
echo.***********************************
echo.
echo.DONE CREATING %projectRootFolder% AND INSTALLING NODE MODULES
echo.
echo.***********************************
echo.

:LOGFILE
For /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c/%%a/%%b)
For /f "tokens=1-3 delims=/:" %%a in ("%TIME%") do (set mytime=%%a:%%b:%%c)
echo.%mydate% %mytime% - %* | tee -a %logFile%
EXIT /B 0

pause