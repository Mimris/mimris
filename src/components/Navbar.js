import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router'
import { FaUser, FaEnvelope } from 'react-icons/fa';
// import { set } from 'immer/dist/internal';

const debug = false;

const DropdownMenu = ({ options, domainName }) => {
	const [isOpen, setIsOpen] = useState(false);
	
	const toggleMenu = () => {
	  setIsOpen(!isOpen);
	};
  
	return (
		<div className="dropdown">
		<button 
			className="btn bg-light text-secondary dropdown-toggle btn-sm p-1" 
			type="button" 
			data-toggle="tooltip" data-placement="top" data-bs-html="true"
			title={`Current version is : ${domainName}. Click to change version`}
			onClick={toggleMenu}>
		  v.
		</button>
		<div className={`dropdown-menu ${isOpen ? 'show' : ''}`}>
		  {options.map((option) => (
			<Link href={option.href} key={option.label}
			  className={`dropdown-item ${option.active ? 'active' : ''}`} >
				{option.label}
			</Link>
		  ))}
		</div>
	  </div>
	);
  };


const Navbar = (props) => {
	const router = useRouter();
	const currentRoute = router.pathname;
	if (debug) console.log('11 Navbar currentRoute', currentRoute, props);

	const [domainName, setDomainName] = useState("");
	useEffect(() => {
		setDomainName(window.location.hostname);
		if (debug) console.log(domainName);
	}, []);

	const options = [
		{
		  label: 'Final version',
		  href: 'https://akmmclient.vercel.app/modelling',
		  active: domainName === 'akmmclient.vercel.app',
		},
		{
		  label: 'Beta version',
		  href: 'https://akmmclient-beta.vercel.app/modelling',
		  active: domainName === 'akmmclient-beta.vercel.app',
		},
		{
		  label: 'Alfa version',
		  href: 'https://akmmclient-alfa.vercel.app/modelling',
		  active: domainName === 'akmmclient-alfa.vercel.app',
		},
	  ];



	return (
		<nav className="navbar navbar-expand-sm" 
			style= {(domainName === "localhost") 
				? {backgroundColor: "#efe"} 
				: {backgroundColor: " #efefef"}
			}>
			<div className="d-flex justify-content-center align-items-center">
				<Link className="navbar-brand navbar-left mx-2" href="#">
					<img src="images/equinor-logo.svg" width="110px" height="60px" className="d-inline-block align-top" alt="Equinor logo" />
				</Link>
				<Link className="navbar-brand navbar-left ms-2 me-auto fs-2 " href="#">
					<strong className="text-success">AKM Modeller</strong>
				</Link>
				<div className="mx-4">
					<DropdownMenu options={options} domainName={domainName} />
				</div>
			</div>
			<div className="">
				<div className="collapse navbar-collapse " id="nav-toggler-metis">
					<ul className="navbar-nav fs-5 ">
						<li className={`nav-item ${currentRoute === "/" ? "active" : ""}`}>
							<Link  href="/">Home</Link>
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
						<li className={`nav-item ${currentRoute === "/helpblog" ? "active" : ""}`} >
							<Link  href="/helpblog">Help</Link>
						</li>
						<li className={`nav-item ${currentRoute === "/about" ? "active" : ""}`} >
							<Link  href="/about">About</Link>
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
			<div className="navbar-nav ms-auto">
				<Link className="navbar-brand p-4 mt-2 ms-auto" href="http://www.kavca.no" target="_blank">
					<div className="d-flex justify-content-center align-items-baseline">
						<img src="images/Kavca-logo2.png" width="20" height="20" className="" alt="Kavca logo" />
						<span className="fw-bold fs-4" style={{ color: "#0083e2" }}>avca AS</span>
					</div>
				</Link>
			</div>

		<style jsx>{`
		  	nav {
				height: 46px;
				padding-bottom: 5px;
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
				align-items: center; 
				height: 100%;
				background: #cdd;
				border-top: 4pbx solid #aaa
				border-right: 4px solid #fff;
				border-bottom: 3px solid #fff;
			}
			.nav-item:first-child {
				border-left: 4px solid #ddd;
			}
			.nav-item:last-child {
				border-right: 4px solid #fff;
			}
			/* Basic styles for nav links */
			nav Links {
				display: flex;
				align-items: between;
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
			// .non-active {
			// 	color: blue;
			// }
	
			/* Specific styles for active links */
			.active {
				color: black;
				background: #d0d8d8;
				border-top: 3px solid #fff;
				border-right: 3px solid #ccc;
				border-left: 3px solid #fff;
				border-bottom: 3px solid #d0d8d8;
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