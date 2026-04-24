import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
// import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router'
// import { Dropdown } from 'react-bootstrap';
import { FaUser, FaBars } from 'react-icons/fa';
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
	const currentRoute = router.pathname;
	if (debug) console.log('42 Navbar currentRoute', currentRoute, props);
	const [version, setVersion] = useState("");
	const [domainName, setDomainName] = useState("");
	const [isMiniMenuOpen, setIsMiniMenuOpen] = useState(false);
	const menuRef = useRef(null);
	const isMiniModel = props.variant === 'mini-model';
	const metisName = typeof props.metisName === 'string' ? props.metisName.trim() : '';
	const suiteLabel = typeof props.suiteLabel === 'string' ? props.suiteLabel.trim() : '';
	const canSaveToServer = Boolean(props.canSaveToServer && typeof props.onSaveToServer === 'function');

	useEffect(() => {
		if (!isMiniMenuOpen) return;
		const handleOutsideClick = (event) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setIsMiniMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handleOutsideClick);
		return () => document.removeEventListener('mousedown', handleOutsideClick);
	}, [isMiniMenuOpen]);

	useEffect(() => {
		if (debug) console.log('72 Navbar useEffect 1 [domainName]');
		setDomainName(window.location.hostname);
		if ((debug)) console.log('33', domainName);
		if (domainName === "localhost") {
			setVersion("local");
		} else if (domainName === "mimris.vercel.app") {
			setVersion("prod");
			// } else if (domainName === "akmmclient-beta.vercel.app") {
			// 	setVersion("beta");
			// } else if (domainName === "akmmclient-alfa.vercel.app") {
			// 	// } else if (domainName === "akmmclient-alpha.vercel.app") { // Change to alpha when alpha is ready
			// 	setVersion("alpha");
		}

	}, [domainName]);

	const options = [
		{
			label: 'Prod version',
			href: 'https://mimris.vercel.app/modelling',
			active: domainName === 'mimris.vercel.app',
		},
		// {
		// 	label: 'Beta version',
		// 	href: 'https://akmmclient-beta.vercel.app/modelling',
		// 	active: domainName === 'akmmclient-beta.vercel.app',
		// },
		// {
		// 	label: 'Alpha version',
		// 	href: 'https://akmmclient-alfa.vercel.app/modelling', // Change to alpha when alpha is ready
		// 	active: domainName === 'akmmclient-alfa.vercel.app',
		// },
		// {
		//   label: 'Local version',
		//   href: 'http://localhost:3000/modelling',
		//   active: domainName === 'localhost:3000',
		// },
	];

	const navbarStyle = isMiniModel
		? {
			marginLeft: "32px",
			marginRight: "32px",
			backgroundColor: " #efefef",
			minHeight: "38px",
		}
		: ((domainName === "localhost")
			? { marginLeft: "36px", marginRight: "36px", backgroundColor: "#efe" }
			: { marginLeft: "32px", marginRight: "32px", backgroundColor: " #efefef" });

	return (
		<nav className={`navbar navbar-expand-sm navbar-toggler ps-0 ${isMiniModel ? 'mini-navbar' : 'pb-0'}`}
			style={navbarStyle}>
			{isMiniModel && (
				<div className='buttons mini-buttons' aria-expanded="false">
					<div className="mini-menu-wrapper" ref={menuRef}>
						<button
							type="button"
							className="btn btn-sm btn-light border mini-menu-button"
							title="Model actions"
							aria-label="Model actions"
							onClick={() => setIsMiniMenuOpen((open) => !open)}
						>
							<FaBars style={{ color: '#2f6ea5', fontSize: '1.2rem', display: 'block' }} />
						</button>
						{isMiniMenuOpen && (
							<div className="mini-menu-dropdown shadow-sm">
								<button
									type="button"
									className="dropdown-item"
									onClick={() => {
										setIsMiniMenuOpen(false);
										router.push('/modelling');
									}}
								>
									Open modelling
								</button>
								{canSaveToServer && (
									<button
										type="button"
										className="dropdown-item"
										onClick={() => {
											setIsMiniMenuOpen(false);
											props.onSaveToServer();
										}}
									>
										{props.isSavingToServer ? 'Saving...' : 'Save to server'}
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			)}
			<div className={`navbar-collapse ${isMiniModel ? 'd-flex w-100 align-items-center justify-content-between px-3 mini-model-shell' : 'collapse'}`} id="nav-toggler-metis">
				<div className="navbar-nav d-flex justify-content-between align-items-top"
					style={isMiniModel ? { marginLeft: "0" } : { marginLeft: "1vw" }}
				>
					<div className="d-flex align-items-center gap-2">
						<Link href={isMiniModel ? "/modelling" : "/"} className="text-decoration-none d-flex align-items-center gap-2">
							<strong className="text-success fs-2" style={{ whiteSpace: "nowrap" }}>Mimris</strong>
						</Link>
					</div>
					{!isMiniModel && (
						<div className={currentRoute === '/modelling' ? "me-4 d-flex align-items-center" : "mb-2 me-4 d-flex justify-content-between align-items-center"}>
							{currentRoute === '/modelling' ? (
								<span className="mx-1 text-secondary bg-transparent d-inline-flex align-items-center" style={{ whiteSpace: "nowrap", scale: "0.8", height: "100%", marginTop: "4px" }}>
									{metisName || 'Metis'}
								</span>
							) : (
								<>
									<span className="mx-1 pt-2 text-secondary bg-transparent" style={{ whiteSpace: "nowrap", scale: "0.8" }} >version: {version}</span>
									<DropdownMenu options={options} domainName={domainName} />
								</>
							)}
						</div>
					)}
				</div>
				{!isMiniModel && (
					<ul className="navbar-nav ">
						<li className={`nav-item ${currentRoute === "/" ? "active" : ""}`}>
							<Link href="/">Home</Link>
						</li>
						<li className={`nav-item ${currentRoute === "/modelling" ? "active" : ""}`}>
							<Link href="/modelling" >Modelling</Link>
						</li>
						<li className={`nav-item ${currentRoute === "/helpblog" ? "active" : ""}`} >
							<Link href="/helpblog">Help</Link>
						</li>
						<li className={`nav-item ${currentRoute === "/videos" ? "active" : ""}`}>
							<Link href="/videos">Videos</Link>
						</li>
						<li className={`nav-item ${currentRoute === "/about" ? "active" : ""}`} >
							<Link href="/about">About</Link>
						</li>
					</ul>
				)}
				{isMiniModel && suiteLabel && (
					<div className="mini-suite-label text-secondary small text-truncate px-3" title={suiteLabel}>
						{suiteLabel}
					</div>
				)}
				<div className="navbar-nav ms-auto d-flex flex-row align-items-center" style={{ marginRight: "1vw" }}>
					<span className="username d-flex justify-content-start align-items-center">
						<FaUser color={(props.user?.name !== 'User') ? "green" : "red"} style={{ paddingRigth: "4px", verticalAlign: "baseline" }} />
					</span>
					<span className="ms-1 p-1 bg-light" >
						{(props.user?.name !== 'User' && props.user?.name !== 'No GitHub User identified') ? props.user?.name : "Guest"}
					</span>
				</div>
			</div>
			{!isMiniModel && (
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
			)}
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
			.mini-navbar {
				height: 38px;
				min-height: 38px;
				padding-top: 0;
				padding-bottom: 0;
			}
			.mini-model-shell {
				padding-left: 12px !important;
				margin-left: 6px;
				background: #fff;
				border: 1px solid #d8d8d8;
				border-radius: 6px;
				box-shadow: 0 1px 2px rgba(0,0,0,0.05);
			}
			.mini-buttons {
				display: flex;
				align-items: center;
				justify-content: flex-start;
				padding-left: 0;
				padding-right: 0;
				margin-left: -32px;
				margin-right: 0;
				background: transparent;
				border: none;
				box-shadow: none;
				flex: 0 0 auto;
				width: 30px;
				min-height: 32px;
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
			.mini-suite-label {
				max-width: 420px;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.mini-menu-wrapper {
				position: relative;
				margin-left: 0;
				margin-right: 0;
				flex: 0 0 auto;
			}
			.mini-menu-button {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 28px;
				height: 28px;
				border: 1px solid #d8d8d8;
				background: #fff;
				border-radius: 6px;
				padding: 0;
				margin: 0;
			}
			.mini-menu-dropdown {
				position: absolute;
				left: 0;
				top: calc(100% + 4px);
				min-width: 160px;
				background: #fff;
				border: 1px solid #d9d9d9;
				border-radius: 6px;
				padding: 4px 0;
				z-index: 50;
				text-align: left;
			}
			.mini-menu-dropdown :global(.dropdown-item) {
				text-align: left;
			}
			@media (max-width: 768px) {
				.mini-suite-label {
					max-width: 220px;
				}
			}
			`}</style>
		</nav>);
};

export default Navbar;
