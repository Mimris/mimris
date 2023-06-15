import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router'
import { FaUser, FaEnvelope } from 'react-icons/fa';

const debug = false;
const Navbar = (props) => {
	const router = useRouter();
	const currentRoute = router.pathname;
	if (debug) console.log('8 Navbar currentRoute', currentRoute, props);
	const [betaversion, setBetaversion] = useState(false);
	const href = betaversion
		? (process.env.NODE_ENV === 'development')
			? "http://localhost:3000/about"
			: "https://akmmclient-main-git-main23-snorres.vercel.app/modelling"
		: (process.env.NODE_ENV === 'development')
			? "http://localhost:3000/modelling"
			: "https://akmmclient-main.vercel.app/modelling";

	const handleLinkClick = (event) => {
		// event.preventDefault(); // prevents the link from navigating away
		setBetaversion(!betaversion); // sets betaversion to true
	};

	return (
		<nav className="navbar navbar-expand-sm d-flex justify-content-between bg-ligth my-0 py-0">
			<div className="d-flex  w-50 mx-0 ">
				<div className="d-flex justify-content-between" style={{ width: "692px" }}>
					<a className="navbar-brand navbar-left mr-4" href="#">
						<img src="images/equinor-logo.svg" width="100" height="40" className="d-inline-block align-top" alt="Equinor logo" />
					</a>
					<span className="fs-3 text-warning" style={{ fontsize: "30%", maxWidth: "30%", minWidth: "280px", marginTop: "5px" }}>
						<Link href={href} onClick={handleLinkClick}>
							<strong>AKM Modeller </strong>
							<small className="border border-primary px-2 rounded "> {betaversion ? "beta" : "final"} </small>
						</Link>
					</span>
				</div>
				<div className="collapse navbar-collapse mt-1" id="nav-toggler-metis">
					<ul className="navbar-nav bg-light">
						<li className={`nav-item ${currentRoute === "/" ? "active" : ""}`}>
							<Link href="/">Home</Link>
						</li>
						<li className={`nav-item ${currentRoute === "/project" ? "active" : ""}`}>
							<Link href="/project">Project</Link>
						</li>
						<li className={`nav-item ${currentRoute === "/modelling" ? "active" : ""}`}>
							<Link href="/modelling">Modelling</Link>
						</li>
						<li className={`nav-item ${currentRoute === "/context" ? "active" : ""}`}>
							<Link href="/context">Context</Link>
						</li>
						<li className={`nav-item ${currentRoute === "/helpblog" ? "active" : ""}`}>
							<Link href="/helpblog">Help</Link>
						</li>
						<li className={`nav-item ${currentRoute === "/about" ? "active" : ""}`}>
							<Link href="/about">About</Link>
						</li>
						<li className="nav-item" style={{ minWidth: "140px" }}>
							<a
								className={currentRoute === "/Modelling" ? "active" : "non-active"}
								href="mailto:snorre.fossland@kavca.no?cc=frank.lillehagen@kavca.no&subject=More info about how to progress with AKM Modeller and access to more templates and examples.&body=Hi, Please send me more info about: xxxxxx.     My Name is: xxxxxx, Email: xxxxx, Phone: 99999999. "
								target="_blank"
								style={{ whiteSpace: "nowrap" }}
							>
								<FaEnvelope style={{ width: "36px", verticalAlign: "middle" }} />More info
							</a>
						</li>
					</ul>
				</div>
				<div className='buttons' aria-expanded="false">
					<button
						className="navbar-toggler navbar-light"
						type="button"
						data-toggle="collapse"
						data-target="#nav-toggler-metis"
						aria-controls="nav-toggler-metis"
						aria-expanded="false"
						aria-label="Toggle navigation"
					>
						<span className="navbar-toggler-icon "></span>
					</button>
				</div>
			</div>
			<a className="navbar-brand ml-auto" href="http://www.kavca.no">
				<img src="images/Kavca-logo2.png" width="22" height="24" className="d-inline-block align-top m-1" alt="Kavca logo" />
				<span className="fw-bold fs-4" style={{ color: "#0083e2" }}>avca AS</span>
			</a>
			<style jsx>{`
		  nav {
			height: 50px;
			display: flex;
			justify-content: center;
			align-items: center;
			background: #e5e5e5;
			box-shadow: 0 0px 10px #aaa;
		}
		.nav-item {
		background: #efefef;
		border-top: 3px solid #ccc;
		border-bottom: 3px solid #fff;
		}

		.nav-item:first-child {
		border-left: 3px solid #ddd;
		}

		  /* Basic styles for nav links */
		  nav a {
			display: flex;
			align-items: center;
			padding-left: 20px;
			padding-right: 20px;
			height: 100%;
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
			color: blue;
		  }
  
		  /* Specific styles for active links */
		  .active {
			color: black;
			background: #e5e5e5;
			border-top: 3px solid #fff;
			border-right: 3px solid #ccc;
			border-left: 3px solid #fff;
			border-bottom: 3px solid #e5e5e5;
			border-radius: 10px 10px 0 0;
		  }
			/* Specific styles for the navbar brand */
			.navbar-brand {
			  display: flex;
			  align-items: center;
			  height: 100%;
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