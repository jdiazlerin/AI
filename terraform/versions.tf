terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.2"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.1"
    }
  }
  
  backend "s3" {
    bucket  = "jason-test-tf-state-bucket"
    key     = "tf-state-folder/simon-game/terraform.tfstate"
    region  = "eu-west-1"
    encrypt = true
  }
}
