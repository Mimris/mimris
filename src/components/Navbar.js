import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
// import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router'
// import { Dropdown } from 'react-bootstrap';
import { FaUser, FaEnvelope } from 'react-icons/fa';
// import { domain } from 'process';

// import { ReadModelFromFile } from './utils/ReadModelFromFile';

const debug = false;

const DropdownMenu = ({ options, domainName }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedOption, setSelectedOption] = useState(null); // Add selectedOption state

	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};

	const handleOptionClick = (option) => {
		setSelectedOption(option.label);
		toggleMenu();
	};

	return (
		<div className="dropdown">
			<button
				className="btn bg-light text-secondary dropdown-toggle btn-sm p-1"
				type="button"
				data-toggle="tooltip" data-placement="top" data-bs-html="true"
				title={`Current version is : ${domainName}. Click to change version`}
				onClick={toggleMenu}>
				{/* {selectedOption ? selectedOption : ''}  */}
			</button>
			<div className={`dropdown-menu ${isOpen ? 'show' : ''}`}>
				{options.map((option) => (
					<Link href={option.href || '#'} key={option.label} // Add default value for href prop
						className={`dropdown-item ${option.active ? 'active' : ''}`}
						onClick={() => handleOptionClick(option)}>{option.label}</Link>
				))}
			</div>
		</div>
	);
};

const Navbar = (props) => {
	const router = useRouter();
	// const fileInput = useRef(null);
	// const dispatch = useDispatch();

	const currentRoute = router.pathname;
	if (debug) console.log('42 Navbar currentRoute', currentRoute, props);
	const [version, setVersion] = useState("");
	const [domainName, setDomainName] = useState("");

	// const [activeItem, setActiveItem] = useState(null);

	// const handleReadProjectFile = (e) => {
	// 	console.log('60 handleReadProjectFile', e.target.files[0], props, dispatch);
	// 	// handle file reading here
	// 	ReadModelFromFile(props, dispatch, e);
	// 	// const file = e.target.files[0];
	// 	// console.log(file);
	// };

	// const handleFileOpen = () => {
	// 	fileInput.current.click();
	// };

	useEffect(() => {
		if (debug) console.log('72 Navbar useEffect 1 [domainName]');
		setDomainName(window.location.hostname);
		if ((debug)) console.log('33', domainName);
		if (domainName === "localhost") {
			setVersion("local");
		} else if (domainName === "akmmclient.vercel.app") {
			setVersion("prod");
		} else if (domainName === "akmmclient-beta.vercel.app") {
			setVersion("beta");
		} else if (domainName === "akmmclient-alfa.vercel.app") {
			// } else if (domainName === "akmmclient-alpha.vercel.app") { // Change to alpha when alpha is ready
			setVersion("alpha");
		}

	}, [domainName]);

	const options = [
		{
			label: 'Prod version',
			href: 'https://akmmclient.vercel.app/modelling',
			active: domainName === 'akmmclient.vercel.app',
		},
		{
			label: 'Beta version',
			href: 'https://akmmclient-beta.vercel.app/modelling',
			active: domainName === 'akmmclient-beta.vercel.app',
		},
		{
			label: 'Alpha version',
			href: 'https://akmmclient-alfa.vercel.app/modelling', // Change to alpha when alpha is ready
			active: domainName === 'akmmclient-alfa.vercel.app',
		},
		// {
		//   label: 'Local version',
		//   href: 'http://localhost:3000/modelling',
		//   active: domainName === 'localhost:3000',
		// },
	];

	return (
		<nav className="navbar navbar-expand-sm navbar-toggler ps-0 pb-0"
			style={(domainName === "localhost")
				? { marginLeft: "36px", marginRight: "36px", backgroundColor: "#efe" }
				: { marginLeft: "32px", marginRight: "32px", backgroundColor: " #efefef" }}>
			<div className="collapse navbar-collapse" id="nav-toggler-metis">
				<div className="navbar-nav d-flex justify-content-between align-items-top"
					style={{ marginLeft: "1vw" }}
				>
					<strong className="text-success fs-2" style={{ whiteSpace: "nowrap" }}>Mimris</strong>
					<div className="mb-2 me-4 d-flex justify-content-between align-items-center">
						<span className="mx-1 pt-2 text-secondary bg-transparent" style={{ whiteSpace: "nowrap", scale: "0.8" }} >version: {version}</span>
						<DropdownMenu options={options} domainName={domainName} />
					</div>
				</div>
				<ul className="navbar-nav ">
					<li className={`nav-item ${currentRoute === "/" ? "active" : ""}`}>
						<Link href="/">Home</Link>
					</li>
					<li className={`nav-item ${currentRoute === "/modelling" ? "active" : ""}`}>
						<Link href="/modelling" >Modelling</Link>
					</li>
					{/* <li className={`nav-item ${currentRoute === "/project" ? "active" : ""}`}>
							<Link href="/project">Project</Link>
						</li> */}
					{/* <li className={`nav-item ${currentRoute === "/context" ? "active" : ""}`}>
							<Link href="/context">Focus</Link>
						</li> */}

					{/* <li 
							className={`nav-item ${currentRoute === "/context" ? "active" : ""}`}>
							<Link 
								style={{paddingLeft: "30px", width: "100px"}} 
								href="/tasks">
								Tasks
							</Link>
						</li> */}
					{/* <li className={`nav-item ${currentRoute === "/table" ? "active" : ""}`}>
							<Link href="/table">Tables</Link>
						</li> */}
					<li className={`nav-item ${currentRoute === "/helpblog" ? "active" : ""}`} >
						<Link href="/helpblog">Help</Link>
					</li>
					<li className={`nav-item ${currentRoute === "/videos" ? "active" : ""}`}>
						<Link href="/videos">Videos</Link>
					</li>
					<li className={`nav-item ${currentRoute === "/about" ? "active" : ""}`} >
						<Link href="/about">About</Link>
					</li>
					{/* <li className="nav-item pt-1 ps-1" style={{ minWidth: "54px"}}>
							<Link
								className={currentRoute === "/Modelling" ? "active" : "non-active"}
								href="mailto:snorre.fossland@kavca.no?cc=frank.lillehagen@kavca.no&subject=More info about how to progress with AKM Modeller and access to more templates and examples.&body=Hi, Please send me more info about: xxxxxx.     My Name is: xxxxxx, Email: xxxxx, Phone: 99999999. "
								target="_blank"
								style={{ }}
							>
								<FaEnvelope style={{  }} />
							</Link>
						</li> */}
				</ul>
				{/* </div> */}
				<div className="navbar-nav  ms-auto" style={{ marginRight: "1vw" }}>
					<span className="username d-flex justify-content-start align-items-center">
						<FaUser color={(props.user?.name !== 'User') ? "green" : "red"} style={{ paddingRigth: "4px", verticalAlign: "baseline" }} />
					</span>
					<span className="ms-1 p-1 bg-light" >
						{(props.user?.name !== 'User' && props.user?.name !== 'No GitHub User identified') ? props.user?.name : "Guest"}
					</span>
				</div>
				<div className="navbar-nav">
					{/* <Link className="navbar-brand navbar-right me-0" href="http://www.kavca.no" target="_blank">
						<div className="d-flex justify-content-end align-items-baseline">
							<img src="images/Kavca-logo2.png" width="18" height="18" className="" alt="Kavca logo" />
							<span className="fw-bold fs-5" style={{ color: "#0083e2" }}>avca AS</span>
						</div>
					</Link> */}
				</div>
			</div>
			<div className='buttons' aria-expanded="false">
				<button
					className="navbar-toggler navbar-light bg-light "
					type="button"
					data-toggle="collapse"
					data-target="#nav-toggler-metis"
					aria-controls="nav-toggler-metis"
					aria-expanded="false"
					aria-label="Toggle navigation"
				>
					<span className="navbar-toggler-icon ">toggler icon</span>
				</button>
			</div>
			<style jsx>{`
		  	nav {
				height:38px;
				padding-bottom: 2px;
				display: flex;
				justify-content: between;
				align-items: center;
				background: #dadada;
				box-shadow: 0 0px 10px #ccc;
			}
			.nav-item {
				width: 8rem;
				display: flex;
				justify-content: center;
				align-items: baseline; 
				padding: 2px 10px;
				width: 100%;
				height: 100%;
				background: #ebf0f0;
				border-radius: 10px 10px 0 0;
				border-top: 4px solid #aaa
				border-right: 4px solid #fff;
				border-left: 1px solid #fff;
				border-bottom: 4px solid #ebf0f0;
			}
			.nav-item:first-child {
				// border-left: 4px solid #ddd;
			}
			.nav-item:last-child {
				// border-right: 4px solid #fff;
			}
			/* Basic styles for nav links */
			nav Links {
				display: flex;
				align-items: between;
				padding-left: 20px;
				padding-right: 20px;
				text-decoration: none;
				color: #55f;
				font-weight: bold;
				background: #e5e5e5;
				border-bottom: 3px solid transparent;
				border-right: 3px solid #fff;
				transition: border-color 0.2s ease-in-out;
			}
	
			/* Specific styles for non-active links */
			.non-active {
				color: gray;
			}
	
			/* Specific styles for active links */
			.active {
				color: black;
				background: #bacfcf;
				border-top: 0px solid #fff;
				border-right: 3px solid #ccc;
				border-left: 3px solid #fff;
				border-bottom: 7px solid #bacfcf;
				border-radius: 10px 10px 0 0;
			}
				/* Specific styles for the navbar brand */
				.navbar-brand {
				display: flex;
				align-items: center;
				height: 80%;
				padding-left: 20px;
				padding-right: 20px;
				text-decoration: none;
				color: #0083e2;
				font-weight: bold;
				}
			
				/* Specific styles for the active navbar brand */
				.navbar-brand.active {
				background: #0083e2;
				color: #fff;
				}
			
				/* Specific styles for the dropdown menu */
				.dropdown-menu {
				background: #fff;
				border: none;
				box-shadow: 0 0px 10px #aaa;
				}
			
				/* Specific styles for the dropdown menu items */
				.dropdown-item {
				color: #333;
				font-weight: bold;
				padding: 10px 20px;
				transition: background-color 0.2s ease-in-out;
				}
			
				/* Specific styles for the active dropdown menu item */
				.dropdown-item.active,
				.dropdown-item:hover {
				background-color: #f5f5f5;
				}
			`}</style>
		</nav>);
};

export default Navbar;